import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Content,
  type Part,
} from '@google/generative-ai';
import type { AiAttachment, AiModel, AiRequest, AiTurn, IAiAdapter } from './ai-adapter';

const MODELS: AiModel[] = [
  { id: 'gemini-3.8-flash', label: 'Flash', description: 'Rapide et polyvalent' },
  { id: 'gemini-pro-latest', label: 'Pro', description: 'Raisonnement plus poussé, plus lent' },
  {
    id: 'gemini-flash-lite-latest',
    label: 'Flash Lite',
    description: 'Le plus rapide, pour les questions simples',
  },
];

const TITLE_MODEL = 'gemini-flash-lite-latest';

const SAFETY_SETTINGS = [
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }));

@Injectable()
export class GeminiAiAdapter implements IAiAdapter {
  private readonly generativeAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiAiAdapter.name);
  readonly models = MODELS;
  readonly defaultModel: string;

  // Erreurs passagères côté Google (quota, surcharge) : on réessaie avant d'abandonner
  private static readonly RETRYABLE_STATUSES = new Set([429, 500, 503]);
  private static readonly RETRY_DELAYS_MS = [1000, 3000];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('GEMINI_API_KEY is required');
    }
    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = this.isOffered(process.env.GEMINI_MODEL)
      ? process.env.GEMINI_MODEL
      : MODELS[0].id;
  }

  resolveModel(model?: string | null) {
    return this.isOffered(model) ? model : this.defaultModel;
  }

  async *streamResponse(request: AiRequest): AsyncGenerator<string> {
    const model = this.generativeAI.getGenerativeModel({
      model: this.resolveModel(request.model),
      systemInstruction: request.systemInstruction || undefined,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7, topK: 40, topP: 0.95 },
      safetySettings: SAFETY_SETTINGS,
    });

    const chat = model.startChat({ history: this.toContents(request.history ?? []) });
    const parts = [...this.toParts(request.attachments ?? []), { text: request.prompt }];

    const { stream } = await this.withRetry(() =>
      chat.sendMessageStream(parts, { signal: request.signal }),
    );
    for await (const chunk of stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async generateTitle(question: string, answer: string): Promise<string | null> {
    try {
      const model = this.generativeAI.getGenerativeModel({ model: TITLE_MODEL });
      const result = await model.generateContent(
        'Donne un titre court en français (3 à 6 mots) pour cette conversation. ' +
          'Réponds uniquement par le titre, sans guillemets ni ponctuation finale.\n\n' +
          `Question : ${question.slice(0, 1000)}\nRéponse : ${answer.slice(0, 1000)}`,
      );
      const title = result.response
        .text()
        .trim()
        .replace(/^["«“'\s]+|["»”'.\s]+$/g, '')
        .trim();
      return title ? title.slice(0, 80) : null;
    } catch (error) {
      this.logger.warn(`Titre automatique indisponible : ${(error as Error).message}`);
      return null;
    }
  }

  private isOffered(model?: string | null) {
    return !!model && MODELS.some((offered) => offered.id === model);
  }

  private toContents(history: AiTurn[]): Content[] {
    return history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }));
  }

  // Images et PDF sont lus nativement par Gemini ; les fichiers texte sont joints au prompt
  private toParts(attachments: AiAttachment[]): Part[] {
    return attachments.map((file): Part =>
      file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf'
        ? { inlineData: { mimeType: file.mimeType, data: file.data.toString('base64') } }
        : {
            text: `Fichier joint « ${file.name} » :\n\`\`\`\n${file.data.toString('utf8')}\n\`\`\``,
          },
    );
  }

  private async withRetry<T>(call: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await call();
      } catch (error) {
        const status = (error as { status?: number }).status;
        const delay = GeminiAiAdapter.RETRY_DELAYS_MS[attempt];
        if (!status || !GeminiAiAdapter.RETRYABLE_STATUSES.has(status) || delay === undefined) {
          throw error;
        }
        this.logger.warn(`Gemini indisponible (${status}), nouvel essai dans ${delay} ms`);
        await this.wait(delay);
      }
    }
  }

  protected wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

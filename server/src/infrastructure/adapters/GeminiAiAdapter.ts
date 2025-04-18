import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  Part,
} from '@google/generative-ai';

export interface IAiAdapter {
  getAiResponse(
    prompt: string,
    conversationHistory?: string[],
  ): Promise<string>;
}

@Injectable()
export class GeminiAiAdapter implements IAiAdapter {
  private readonly generativeAI: GoogleGenerativeAI;
  private readonly model: string;
  private readonly logger = new Logger(GeminiAiAdapter.name);

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('GEMINI_API_KEY is required');
    }

    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  async getAiResponse(
    prompt: string,
    conversationHistory: string[] = [],
  ): Promise<string> {
    try {
      this.logger.log(
        `Getting AI response for prompt: "${prompt.substring(0, 50)}..."`,
      );

      // Obtenir le modèle
      const model = this.generativeAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      // Préparer l'historique de conversation pour donner du contexte
      const chat = model.startChat({
        history: this.formatHistoryForGemini(conversationHistory),
      });

      // Envoyer la requête à l'API Gemini
      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      this.logger.log(
        `Received response from Gemini: "${response.substring(0, 50)}..."`,
      );
      return response;
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = '[Erreur non sérialisable]';
        }
      } else {
        errorMessage = 'Erreur inconnue';
      }

      this.logger.error(`Error calling Gemini API: ${errorMessage}`);

      // En cas d'erreur, renvoyer un message par défaut
      return "Désolé, je n'ai pas pu générer une réponse pour le moment. Veuillez réessayer plus tard.";
    }
  }

  /**
   * Formate l'historique de conversation pour l'API Gemini
   */
  private formatHistoryForGemini(conversationHistory: string[]): Content[] {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }

    const formattedHistory: Content[] = [];

    for (const message of conversationHistory) {
      if (message.startsWith('User: ')) {
        formattedHistory.push({
          role: 'user',
          parts: [{ text: message.substring(6) } as Part],
        });
      } else if (message.startsWith('AI: ')) {
        formattedHistory.push({
          role: 'model',
          parts: [{ text: message.substring(4) } as Part],
        });
      }
    }

    return formattedHistory;
  }
}

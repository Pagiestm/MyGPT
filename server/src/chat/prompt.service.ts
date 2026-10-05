import { BadRequestException, Injectable } from '@nestjs/common';
import { Conversation } from '../conversation/entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { isBrowserModel, type AiAttachment } from './prompt';
import { ChatService, type ExchangeContext } from './chat.service';

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PreparedExchange {
  question: Message;
  messages: PromptMessage[];
}

@Injectable()
export class PromptService {
  constructor(private readonly chat: ChatService) {}

  assertBrowserModel(model: string) {
    if (!isBrowserModel(model)) {
      throw new BadRequestException(
        'Modèle inconnu : seuls les modèles exécutés dans le navigateur sont pris en charge',
      );
    }
    return model;
  }

  async saveReply(userId: string, conversationId: string, content: string, model: string) {
    this.assertBrowserModel(model);
    const conversation = await this.chat.ownedConversation(conversationId, userId);
    const message = await this.chat.saveReply(conversation.id, content, model);
    return { message, needsTitle: await this.chat.needsTitle(conversation) };
  }

  async saveTitle(userId: string, conversationId: string, name: string) {
    const conversation = await this.chat.ownedConversation(conversationId, userId);
    return { name: await this.chat.applyTitle(conversation.id, name.trim()) };
  }

  async toExchange(
    userId: string,
    conversation: Conversation,
    question: Message,
    questionEmbedding?: number[],
  ): Promise<PreparedExchange> {
    const context = await this.chat.contextFor(userId, conversation, question, questionEmbedding);
    return { question: context.question, messages: this.toMessages(context) };
  }

  private toMessages(context: ExchangeContext): PromptMessage[] {
    const messages: PromptMessage[] = [];
    if (context.systemInstruction) {
      messages.push({ role: 'system', content: context.systemInstruction });
    }
    for (const turn of context.history) {
      messages.push({ role: turn.role === 'model' ? 'assistant' : 'user', content: turn.text });
    }

    messages.push({
      role: 'user',
      content: [...describe(context.attachments), context.question.content].join('\n\n'),
    });
    return messages;
  }
}

export function describe(attachments: AiAttachment[]): string[] {
  return attachments.map((file) =>
    file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf'
      ? `Fichier joint « ${file.name} » : non lisible par un modèle exécuté dans le navigateur.`
      : `Fichier joint « ${file.name} » :\n\`\`\`\n${file.data.toString('utf8')}\n\`\`\``,
  );
}

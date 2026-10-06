import { Injectable } from '@nestjs/common';
import type { Conversation } from '../../conversation/domain/conversation';
import type { Message } from '../../message/domain/message';
import type { AiAttachment } from '../domain/prompt';
import { BuildExchangeContext, type ExchangeContext } from './chat.use-cases';

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PreparedExchange {
  question: Message;
  messages: PromptMessage[];
}

@Injectable()
export class BuildPrompt {
  constructor(private readonly context: BuildExchangeContext) {}

  async execute(
    userId: string,
    conversation: Conversation,
    question: Message,
    questionEmbedding?: number[],
  ): Promise<PreparedExchange> {
    const context = await this.context.execute(userId, conversation, question, questionEmbedding);
    return { question: context.question, messages: toMessages(context) };
  }
}

export function toMessages(context: ExchangeContext): PromptMessage[] {
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

export function describe(attachments: AiAttachment[]): string[] {
  return attachments.map((file) =>
    file.mimeType.startsWith('image/')
      ? `Fichier joint « ${file.name} » : image, non lisible par un modèle exécuté dans le navigateur.`
      : `Fichier joint « ${file.name} » :\n\`\`\`\n${file.data.toString('utf8')}\n\`\`\``,
  );
}

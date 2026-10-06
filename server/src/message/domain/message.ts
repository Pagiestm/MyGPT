import { DomainError } from '../../common/domain/domain-error';

export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface MessageState {
  id: string;
  conversationId: string;
  content: string;
  isFromAi: boolean;
  model: string | null;
  attachments: MessageAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export class Message {
  private constructor(
    readonly id: string,
    readonly conversationId: string,
    public content: string,
    readonly isFromAi: boolean,
    readonly model: string | null,
    readonly attachments: MessageAttachment[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static ask(conversationId: string, content: string): Message {
    const now = new Date();
    return new Message('', conversationId, content, false, null, [], now, now);
  }

  static answer(conversationId: string, content: string, model: string): Message {
    const now = new Date();
    return new Message('', conversationId, content, true, model, [], now, now);
  }

  static rehydrate(state: MessageState): Message {
    return new Message(
      state.id,
      state.conversationId,
      state.content,
      state.isFromAi,
      state.model,
      state.attachments,
      state.createdAt,
      state.updatedAt,
    );
  }

  rewrite(content: string): void {
    if (this.isFromAi) {
      throw new DomainError("Une réponse de l'IA ne peut pas être modifiée");
    }
    this.content = content;
  }

  asTurn(): { role: 'user' | 'model'; text: string } {
    return { role: this.isFromAi ? 'model' : 'user', text: this.content };
  }
}

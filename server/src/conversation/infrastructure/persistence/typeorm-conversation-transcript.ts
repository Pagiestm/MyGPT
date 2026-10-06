import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageOrm } from '../../../message/infrastructure/persistence/message.orm-entity';
import type { ConversationTranscript, TranscriptEntry } from '../../domain/conversation-transcript';

@Injectable()
export class TypeormConversationTranscript implements ConversationTranscript {
  constructor(@InjectRepository(MessageOrm) private readonly messages: Repository<MessageOrm>) {}

  async read(conversationId: string): Promise<TranscriptEntry[]> {
    const rows = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      isFromAi: row.isFromAi,
      model: row.model ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async copy(fromConversationId: string, toConversationId: string): Promise<void> {
    const source = await this.read(fromConversationId);
    if (!source.length) return;
    await this.messages.save(
      source.map((entry) =>
        this.messages.create({
          conversationId: toConversationId,
          content: entry.content,
          isFromAi: entry.isFromAi,
        }),
      ),
    );
  }
}

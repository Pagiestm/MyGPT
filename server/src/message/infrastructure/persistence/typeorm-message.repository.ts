import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import {
  pageBounds,
  toPage,
  type Page,
  type PaginationDto,
} from '../../../common/http/pagination.dto';
import { Message } from '../../domain/message';
import type { MessageHit, MessageRepository } from '../../domain/message.repository';
import { MessageOrm } from './message.orm-entity';

@Injectable()
export class TypeormMessageRepository implements MessageRepository {
  constructor(@InjectRepository(MessageOrm) private readonly messages: Repository<MessageOrm>) {}

  async findById(id: string): Promise<Message | null> {
    const row = await this.messages.findOne({
      where: { id },
      relations: { attachments: true },
    });
    return row ? toDomain(row) : null;
  }

  async findThread(conversationId: string): Promise<Message[]> {
    const rows = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async findBefore(conversationId: string, instant: Date, excludedId: string): Promise<Message[]> {
    const rows = await this.messages.find({
      where: { conversationId, createdAt: LessThan(instant), id: Not(excludedId) },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async findAfter(conversationId: string, instant: Date, excludedId: string): Promise<Message[]> {
    const rows = await this.messages.find({
      where: { conversationId, createdAt: MoreThan(instant), id: Not(excludedId) },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async listForConversation(
    conversationId: string,
    pagination: PaginationDto,
  ): Promise<Page<Message>> {
    const [newestFirst, total] = await this.messages.findAndCount({
      where: { conversationId },
      relations: { attachments: true },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(newestFirst.reverse().map(toDomain), total, pagination);
  }

  async searchInConversation(
    conversationId: string,
    keyword: string,
    pagination: PaginationDto,
  ): Promise<Page<Message>> {
    const [rows, total] = await this.messages.findAndCount({
      where: { conversationId, content: ILike(`%${keyword}%`) },
      order: { createdAt: 'ASC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  async searchForUser(
    userId: string,
    keyword: string,
    pagination: PaginationDto,
  ): Promise<Page<MessageHit>> {
    const [rows, total] = await this.messages.findAndCount({
      where: { content: ILike(`%${keyword}%`), conversation: { userId } },
      relations: { conversation: true },
      select: {
        id: true,
        content: true,
        isFromAi: true,
        createdAt: true,
        updatedAt: true,
        model: true,
        conversationId: true,
        conversation: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    const hits = rows.map((row) => ({
      message: toDomain(row),
      conversationName: row.conversation?.name ?? '',
    }));
    return toPage(hits, total, pagination);
  }

  countAnswers(conversationId: string): Promise<number> {
    return this.messages.countBy({ conversationId, isFromAi: true });
  }

  async conversationIdOf(messageId: string): Promise<string | null> {
    const row = await this.messages.findOne({
      where: { id: messageId },
      select: { id: true, conversationId: true },
    });
    return row?.conversationId ?? null;
  }

  async save(message: Message): Promise<Message> {
    const saved = await this.messages.save(this.messages.create(toOrm(message)));
    return toDomain(saved);
  }

  async saveMany(messages: Message[]): Promise<void> {
    await this.messages.save(messages.map((message) => this.messages.create(toOrm(message))));
  }

  async remove(ids: string[]): Promise<void> {
    if (ids.length) await this.messages.delete({ id: In(ids) });
  }
}

function toDomain(row: MessageOrm): Message {
  return Message.rehydrate({
    id: row.id,
    conversationId: row.conversationId,
    content: row.content,
    isFromAi: row.isFromAi,
    model: row.model ?? null,
    attachments: (row.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(message: Message): Partial<MessageOrm> {
  return {
    ...(message.id ? { id: message.id } : {}),
    conversationId: message.conversationId,
    content: message.content,
    isFromAi: message.isFromAi,
    model: message.model,
  };
}

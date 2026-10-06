import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { pageBounds, toPage, type Page, type PaginationDto } from '../../../common/pagination.dto';
import { Conversation } from '../../domain/conversation';
import type { ConversationRepository } from '../../domain/conversation.repository';
import { ConversationOrm } from './conversation.orm-entity';

@Injectable()
export class TypeormConversationRepository implements ConversationRepository {
  constructor(
    @InjectRepository(ConversationOrm) private readonly conversations: Repository<ConversationOrm>,
  ) {}

  async findById(id: string): Promise<Conversation | null> {
    const row = await this.conversations.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByShareLink(shareLink: string): Promise<Conversation | null> {
    const row = await this.conversations.findOne({ where: { shareLink } });
    return row ? toDomain(row) : null;
  }

  async listForUser(
    userId: string,
    { archived }: { archived: boolean },
    pagination: PaginationDto,
  ): Promise<Page<Conversation>> {
    const [rows, total] = await this.conversations.findAndCount({
      where: { userId, archived },
      order: { pinned: 'DESC', updatedAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  async listSavedByUser(userId: string, pagination: PaginationDto): Promise<Page<Conversation>> {
    const [rows, total] = await this.conversations.findAndCount({
      where: { userId, sharedFrom: Not(IsNull()) },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  async search(
    userId: string,
    keyword: string,
    pagination: PaginationDto,
  ): Promise<Page<Conversation>> {
    const [rows, total] = await this.conversations.findAndCount({
      where: [
        { userId, name: ILike(`%${keyword}%`) },
        { userId, messages: { content: ILike(`%${keyword}%`) } },
      ],
      order: { updatedAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  async ownerPseudoOf(id: string): Promise<string | null> {
    const row = await this.conversations.findOne({
      where: { id },
      relations: { user: true },
      select: { id: true, user: { id: true, pseudo: true } },
    });
    return row?.user?.pseudo ?? null;
  }

  async folderInstructionsOf(
    id: string,
  ): Promise<{ name: string; instructions: string | null } | null> {
    const row = await this.conversations.findOne({
      where: { id },
      relations: { folder: true },
    });
    const folder = row?.folder;
    return folder ? { name: folder.name, instructions: folder.instructions } : null;
  }

  async save(conversation: Conversation): Promise<Conversation> {
    const saved = await this.conversations.save(this.conversations.create(toOrm(conversation)));
    return toDomain(saved);
  }

  async touch(id: string): Promise<void> {
    await this.conversations.update(id, { updatedAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    await this.conversations.delete(id);
  }
}

function toDomain(row: ConversationOrm): Conversation {
  return Conversation.rehydrate({
    id: row.id,
    name: row.name,
    userId: row.userId,
    sharedFrom: row.sharedFrom ?? null,
    isPublic: row.isPublic,
    shareLink: row.shareLink ?? null,
    shareExpiresAt: row.shareExpiresAt ?? null,
    pinned: row.pinned,
    archived: row.archived,
    titleLocked: row.titleLocked,
    folderId: row.folderId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(conversation: Conversation): Partial<ConversationOrm> {
  return {
    ...(conversation.id ? { id: conversation.id } : {}),
    name: conversation.name,
    userId: conversation.userId,
    sharedFrom: conversation.sharedFrom,
    isPublic: conversation.isPublic,
    shareLink: conversation.shareLink,
    shareExpiresAt: conversation.shareExpiresAt,
    pinned: conversation.pinned,
    archived: conversation.archived,
    titleLocked: conversation.titleLocked,
    folderId: conversation.folderId,
  };
}

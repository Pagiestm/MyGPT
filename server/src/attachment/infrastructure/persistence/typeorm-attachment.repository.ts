import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Attachment } from '../../domain/attachment';
import type { AttachmentRepository } from '../../domain/attachment.repository';
import { AttachmentOrm } from './attachment.orm-entity';

const EMPTY = Buffer.alloc(0);

@Injectable()
export class TypeormAttachmentRepository implements AttachmentRepository {
  constructor(
    @InjectRepository(AttachmentOrm) private readonly attachments: Repository<AttachmentOrm>,
  ) {}

  async findById(id: string): Promise<Attachment | null> {
    const row = await this.attachments
      .createQueryBuilder('attachment')
      .addSelect('attachment.data')
      .where('attachment.id = :id', { id })
      .getOne();
    return row ? toDomain(row) : null;
  }

  async findUnlinked(ids: string[], userId: string): Promise<Attachment[]> {
    const rows = await this.attachments.find({
      where: { id: In(ids), userId, messageId: IsNull() },
    });
    return rows.map(toDomain);
  }

  async findForMessage(messageId: string): Promise<Attachment[]> {
    const rows = await this.attachments.find({
      where: { messageId },
      select: { id: true, name: true, mimeType: true, size: true, data: true },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async save(attachment: Attachment): Promise<Attachment> {
    const saved = await this.attachments.save(this.attachments.create(toOrm(attachment)));
    return toDomain({ ...saved, data: attachment.data });
  }

  async linkToMessage(ids: string[], messageId: string): Promise<void> {
    await this.attachments.update(ids, { messageId });
  }
}

function toDomain(row: AttachmentOrm): Attachment {
  return Attachment.rehydrate({
    id: row.id,
    name: row.name,
    mimeType: row.mimeType,
    size: row.size,
    data: row.data ?? EMPTY,
    userId: row.userId,
    messageId: row.messageId ?? null,
    createdAt: row.createdAt,
  });
}

function toOrm(attachment: Attachment): Partial<AttachmentOrm> {
  return {
    ...(attachment.id ? { id: attachment.id } : {}),
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    data: attachment.data,
    userId: attachment.userId,
    messageId: attachment.messageId,
  };
}

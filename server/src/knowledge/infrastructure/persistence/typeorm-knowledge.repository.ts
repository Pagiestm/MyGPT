import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  pageBounds,
  toPage,
  type Page,
  type PaginationDto,
} from '../../../common/http/pagination.dto';
import { KnowledgeDocument, type Chunk } from '../../domain/knowledge-document';
import type { KnowledgeRepository, RetrievedChunk } from '../../domain/knowledge.repository';
import { KnowledgeChunkOrm } from './knowledge-chunk.orm-entity';
import { KnowledgeDocumentOrm } from './knowledge-document.orm-entity';

@Injectable()
export class TypeormKnowledgeRepository implements KnowledgeRepository {
  constructor(
    @InjectRepository(KnowledgeDocumentOrm)
    private readonly documents: Repository<KnowledgeDocumentOrm>,
    @InjectRepository(KnowledgeChunkOrm)
    private readonly chunks: Repository<KnowledgeChunkOrm>,
  ) {}

  async findOwned(id: string, userId: string): Promise<KnowledgeDocument | null> {
    const row = await this.documents.findOne({ where: { id, userId } });
    return row ? toDomain(row) : null;
  }

  async list(
    userId: string,
    folderId: string | null | undefined,
    pagination: PaginationDto,
  ): Promise<Page<KnowledgeDocument>> {
    const [rows, total] = await this.documents.findAndCount({
      where: folderId === undefined ? { userId } : { userId, folderId: folderId ?? null },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  async save(document: KnowledgeDocument): Promise<KnowledgeDocument> {
    const saved = await this.documents.save(this.documents.create(toOrm(document)));
    return toDomain(saved);
  }

  async storeChunks(documentId: string, chunks: Chunk[]): Promise<void> {
    await this.chunks.insert(chunks.map((chunk, position) => ({ documentId, position, ...chunk })));
  }

  search(
    userId: string,
    folderId: string | null,
    embedding: number[],
    limit: number,
  ): Promise<RetrievedChunk[]> {
    return this.chunks
      .createQueryBuilder('chunk')
      .innerJoin('chunk.document', 'document')
      .select('chunk.content', 'content')
      .addSelect('document.name', 'name')
      .addSelect('1 - (chunk.embedding <=> :embedding)', 'score')
      .where('document.userId = :userId', { userId })
      .andWhere('(document.folderId IS NULL OR document.folderId = :folderId)', { folderId })
      .orderBy('chunk.embedding <=> :embedding')
      .setParameter('embedding', toVector(embedding))
      .limit(limit)
      .getRawMany<RetrievedChunk>();
  }

  async remove(id: string): Promise<void> {
    await this.documents.delete(id);
  }
}

function toVector(values: number[]) {
  return `[${values.join(',')}]`;
}

function toDomain(row: KnowledgeDocumentOrm): KnowledgeDocument {
  return KnowledgeDocument.rehydrate({
    id: row.id,
    name: row.name,
    mimeType: row.mimeType,
    size: row.size,
    chunkCount: row.chunkCount,
    embeddingModel: row.embeddingModel,
    userId: row.userId,
    folderId: row.folderId ?? null,
    createdAt: row.createdAt,
  });
}

function toOrm(document: KnowledgeDocument): Partial<KnowledgeDocumentOrm> {
  return {
    ...(document.id ? { id: document.id } : {}),
    name: document.name,
    mimeType: document.mimeType,
    size: document.size,
    chunkCount: document.chunkCount,
    embeddingModel: document.embeddingModel,
    userId: document.userId,
    folderId: document.folderId,
  };
}

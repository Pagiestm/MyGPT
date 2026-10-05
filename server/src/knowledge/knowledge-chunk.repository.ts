import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EMBEDDING_DIMENSIONS } from '../chat/prompt';
import { KnowledgeChunk } from './entities/knowledge-chunk.entity';

export interface ChunkToStore {
  content: string;
  embedding: number[];
}

export interface RetrievedChunk {
  content: string;
  name: string;
  score: number;
}

@Injectable()
export class KnowledgeChunkRepository {
  constructor(
    @InjectRepository(KnowledgeChunk) private readonly chunks: Repository<KnowledgeChunk>,
  ) {}

  insertMany(documentId: string, toStore: ChunkToStore[]): Promise<unknown> {
    return this.chunks.insert(
      toStore.map((chunk, position) => ({ documentId, position, ...chunk })),
    );
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

  hasExpectedSize(embedding: number[]): boolean {
    return embedding.length === EMBEDDING_DIMENSIONS;
  }
}

function toVector(values: number[]) {
  return `[${values.join(',')}]`;
}

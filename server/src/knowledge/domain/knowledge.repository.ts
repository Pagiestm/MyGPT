import type { Page, PaginationDto } from '../../common/http/pagination.dto';
import type { Chunk, KnowledgeDocument } from './knowledge-document';

export interface RetrievedChunk {
  content: string;
  name: string;
  score: number;
}

export const KNOWLEDGE_REPOSITORY = Symbol('KnowledgeRepository');

export interface KnowledgeRepository {
  findOwned(id: string, userId: string): Promise<KnowledgeDocument | null>;
  list(
    userId: string,
    folderId: string | null | undefined,
    pagination: PaginationDto,
  ): Promise<Page<KnowledgeDocument>>;
  save(document: KnowledgeDocument): Promise<KnowledgeDocument>;
  storeChunks(documentId: string, chunks: Chunk[]): Promise<void>;
  search(
    userId: string,
    folderId: string | null,
    embedding: number[],
    limit: number,
  ): Promise<RetrievedChunk[]>;
  remove(id: string): Promise<void>;
}

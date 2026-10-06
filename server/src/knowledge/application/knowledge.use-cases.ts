import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Page, PaginationDto } from '../../common/http/pagination.dto';
import { extractPdfText, isPdf } from '../../common/pdf/pdf-text';
import {
  EMBEDDING_DIMENSIONS,
  KnowledgeDocument,
  type Chunk,
  type SourceFile,
  type SplitDocument,
} from '../domain/knowledge-document';
import {
  KNOWLEDGE_REPOSITORY,
  type KnowledgeRepository,
  type RetrievedChunk,
} from '../domain/knowledge.repository';

const TOP_K = 5;
const MIN_SCORE = 0.3;
const SEARCH_RESULTS = 10;

@Injectable()
export class SplitDocumentIntoChunks {
  async execute(file: SourceFile): Promise<SplitDocument> {
    if (!isPdf(file.mimeType)) return KnowledgeDocument.split(file);

    const text = await extractPdfText(file.data).catch(() => '');
    if (!text.trim()) {
      throw new BadRequestException(
        'Ce PDF ne contient aucun texte : il est probablement scanné en images.',
      );
    }
    return KnowledgeDocument.split({ ...file, mimeType: 'text/plain', data: Buffer.from(text) });
  }
}

@Injectable()
export class StoreDocument {
  constructor(@Inject(KNOWLEDGE_REPOSITORY) private readonly knowledge: KnowledgeRepository) {}

  async execute(
    userId: string,
    input: {
      name: string;
      mimeType: string;
      size: number;
      embeddingModel: string;
      folderId?: string | null;
      chunks: Chunk[];
    },
  ): Promise<KnowledgeDocument> {
    const document = await this.knowledge.save(KnowledgeDocument.index({ ...input, userId }));
    try {
      await this.knowledge.storeChunks(document.id, input.chunks);
    } catch (error) {
      await this.knowledge.remove(document.id);
      throw error;
    }
    return document;
  }
}

@Injectable()
export class ListDocuments {
  constructor(@Inject(KNOWLEDGE_REPOSITORY) private readonly knowledge: KnowledgeRepository) {}

  execute(
    userId: string,
    folderId?: string | null,
    pagination: PaginationDto = {},
  ): Promise<Page<KnowledgeDocument>> {
    return this.knowledge.list(userId, folderId, pagination);
  }
}

@Injectable()
export class RemoveDocument {
  constructor(@Inject(KNOWLEDGE_REPOSITORY) private readonly knowledge: KnowledgeRepository) {}

  async execute(userId: string, id: string): Promise<{ id: string }> {
    const document = await this.knowledge.findOwned(id, userId);
    if (!document) throw new NotFoundException('Document introuvable');
    await this.knowledge.remove(document.id);
    return { id: document.id };
  }
}

@Injectable()
export class SearchDocuments {
  constructor(@Inject(KNOWLEDGE_REPOSITORY) private readonly knowledge: KnowledgeRepository) {}

  async execute(
    userId: string,
    embedding: number[],
    options: { folderId?: string | null; limit?: number } = {},
  ): Promise<RetrievedChunk[]> {
    if (!KnowledgeDocument.isUsableEmbedding(embedding)) {
      throw new BadRequestException(
        `Vecteur attendu en ${EMBEDDING_DIMENSIONS} dimensions, reçu ${embedding.length}`,
      );
    }
    return this.knowledge.search(
      userId,
      options.folderId ?? null,
      embedding,
      options.limit ?? SEARCH_RESULTS,
    );
  }
}

@Injectable()
export class RetrieveContext {
  private readonly logger = new Logger(RetrieveContext.name);

  constructor(@Inject(KNOWLEDGE_REPOSITORY) private readonly knowledge: KnowledgeRepository) {}

  async execute(
    userId: string,
    folderId: string | null,
    questionEmbedding: number[],
  ): Promise<string | null> {
    if (!KnowledgeDocument.isUsableEmbedding(questionEmbedding)) return null;

    try {
      const rows = await this.knowledge.search(userId, folderId, questionEmbedding, TOP_K);
      const kept = rows.filter((row) => Number(row.score) >= MIN_SCORE);
      if (!kept.length) return null;

      const excerpts = kept
        .map((row, index) => `[${index + 1}] Source « ${row.name} » :\n${row.content}`)
        .join('\n\n');
      return (
        "Extraits des documents de l'utilisateur, à utiliser en priorité pour répondre. " +
        "Si la réponse ne s'y trouve pas, dis-le plutôt que d'inventer.\n\n" +
        excerpts
      );
    } catch (error) {
      this.logger.warn(`Recherche documentaire ignorée : ${(error as Error).message}`);
      return null;
    }
  }
}

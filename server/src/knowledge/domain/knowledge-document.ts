import { DomainError } from '../../common/domain/domain-error';
import { chunkText } from './chunking';

export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;
export const EMBEDDING_DIMENSIONS = 768;

const TEXT_EXTENSIONS =
  /\.(txt|md|markdown|csv|tsv|json|xml|ya?ml|html?|rst|org|tex|log|ini|toml|sql)$/i;

export interface SourceFile {
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

export interface Chunk {
  content: string;
  embedding: number[];
}

export interface SplitDocument {
  name: string;
  mimeType: string;
  size: number;
  chunks: string[];
}

export interface KnowledgeDocumentState {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  embeddingModel: string;
  userId: string;
  folderId: string | null;
  createdAt: Date;
}

export class KnowledgeDocument {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly mimeType: string,
    readonly size: number,
    readonly chunkCount: number,
    readonly embeddingModel: string,
    readonly userId: string,
    readonly folderId: string | null,
    readonly createdAt: Date,
  ) {}

  static split(file: SourceFile): SplitDocument {
    if (file.size > MAX_DOCUMENT_SIZE) throw new DomainError('Le document dépasse 2 Mo');

    const chunks = chunkText(KnowledgeDocument.toText(file));
    if (!chunks.length) throw new DomainError('Le document est vide');

    return {
      name: file.name,
      mimeType: file.mimeType || 'text/plain',
      size: file.size,
      chunks,
    };
  }

  static index(input: {
    userId: string;
    name: string;
    mimeType: string;
    size: number;
    embeddingModel: string;
    folderId?: string | null;
    chunks: Chunk[];
  }): KnowledgeDocument {
    const wrong = input.chunks.find((chunk) => chunk.embedding.length !== EMBEDDING_DIMENSIONS);
    if (wrong) {
      throw new DomainError(
        `Vecteurs attendus en ${EMBEDDING_DIMENSIONS} dimensions, reçu ${wrong.embedding.length}`,
      );
    }
    return new KnowledgeDocument(
      '',
      input.name,
      input.mimeType,
      input.size,
      input.chunks.length,
      input.embeddingModel,
      input.userId,
      input.folderId ?? null,
      new Date(),
    );
  }

  static rehydrate(state: KnowledgeDocumentState): KnowledgeDocument {
    return new KnowledgeDocument(
      state.id,
      state.name,
      state.mimeType,
      state.size,
      state.chunkCount,
      state.embeddingModel,
      state.userId,
      state.folderId,
      state.createdAt,
    );
  }

  static isUsableEmbedding(embedding: number[]): boolean {
    return embedding.length === EMBEDDING_DIMENSIONS;
  }

  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  private static toText(file: SourceFile): string {
    const textual =
      file.mimeType.startsWith('text/') ||
      ['application/json', 'application/xml'].includes(file.mimeType) ||
      TEXT_EXTENSIONS.test(file.name);
    if (!textual) {
      throw new DomainError('Formats acceptés : PDF, texte, Markdown, CSV, JSON, XML, YAML, HTML.');
    }
    return file.data.toString('utf8');
  }
}

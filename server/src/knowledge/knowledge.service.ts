import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../conversation/entities/conversation.entity';
import { EMBEDDING_DIMENSIONS } from '../chat/prompt';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { KnowledgeChunkRepository } from './knowledge-chunk.repository';
import { chunkText } from './chunking';
import type { StoreDocumentDto } from './dto/knowledge.dto';
import { pageBounds, toPage, type PaginationDto } from '../common/pagination.dto';

export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;

const TOP_K = 5;
const MIN_SCORE = 0.3;

const TEXT_EXTENSIONS =
  /\.(txt|md|markdown|csv|tsv|json|xml|ya?ml|html?|rst|org|tex|log|ini|toml|sql)$/i;

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectRepository(KnowledgeDocument)
    private readonly documents: Repository<KnowledgeDocument>,
    private readonly chunks: KnowledgeChunkRepository,
  ) {}

  split(file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (file.size > MAX_DOCUMENT_SIZE) throw new BadRequestException('Le document dépasse 2 Mo');

    const chunks = chunkText(this.toText(file));
    if (!chunks.length) throw new BadRequestException('Le document est vide');

    return {
      name: file.originalname,
      mimeType: file.mimetype || 'text/plain',
      size: file.size,
      chunks,
    };
  }

  async store(userId: string, dto: StoreDocumentDto) {
    const wrong = dto.chunks.find((chunk) => !this.chunks.hasExpectedSize(chunk.embedding));
    if (wrong) {
      throw new BadRequestException(
        `Vecteurs attendus en ${EMBEDDING_DIMENSIONS} dimensions, reçu ${wrong.embedding.length}`,
      );
    }

    const document = await this.documents.save(
      this.documents.create({
        name: dto.name,
        mimeType: dto.mimeType,
        size: dto.size,
        chunkCount: dto.chunks.length,
        embeddingModel: dto.embeddingModel,
        userId,
        folderId: dto.folderId ?? null,
      }),
    );

    try {
      await this.chunks.insertMany(document.id, dto.chunks);
    } catch (error) {
      await this.documents.delete(document.id);
      throw error;
    }
    return document;
  }

  async list(userId: string, folderId?: string | null, pagination: PaginationDto = {}) {
    const [items, total] = await this.documents.findAndCount({
      where: folderId === undefined ? { userId } : { userId, folderId: folderId ?? null },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(items, total, pagination);
  }

  async remove(userId: string, id: string) {
    const document = await this.documents.findOne({ where: { id, userId } });
    if (!document) throw new NotFoundException('Document introuvable');
    await this.documents.delete(document.id);
    return { id };
  }

  async contextFor(
    userId: string,
    conversation: Conversation,
    questionEmbedding: number[],
  ): Promise<string | null> {
    if (!this.chunks.hasExpectedSize(questionEmbedding)) return null;

    try {
      const rows = await this.chunks.search(
        userId,
        conversation.folderId,
        questionEmbedding,
        TOP_K,
      );

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

  private toText(file: { originalname: string; mimetype: string; buffer: Buffer }) {
    const textual =
      file.mimetype.startsWith('text/') ||
      ['application/json', 'application/xml'].includes(file.mimetype) ||
      TEXT_EXTENSIONS.test(file.originalname);
    if (!textual) {
      throw new BadRequestException(
        'Formats acceptés : texte, Markdown, CSV, JSON, XML, YAML, HTML. ' +
          'Convertissez les PDF en texte avant de les envoyer.',
      );
    }
    return file.buffer.toString('utf8');
  }
}

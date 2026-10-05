import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeChunkRepository } from './knowledge-chunk.repository';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import type { Conversation } from '../conversation/entities/conversation.entity';

const file = (name: string, mimetype: string, content: string) => ({
  originalname: name,
  mimetype,
  size: Buffer.byteLength(content),
  buffer: Buffer.from(content),
});

const vector = (seed = 0.1) => Array.from({ length: 768 }, () => seed);

const document = (chunks = [{ content: 'Bonjour', embedding: vector() }]) => ({
  name: 'notes.md',
  mimeType: 'text/markdown',
  size: 7,
  embeddingModel: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
  chunks,
});

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const documents = {
    create: jest.fn((data: Partial<KnowledgeDocument>) => data),
    save: jest.fn((data: Partial<KnowledgeDocument>) => Promise.resolve({ id: 'd1', ...data })),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const chunks = {
    insertMany: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
    hasExpectedSize: jest.fn((embedding: number[]) => embedding.length === 768),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    chunks.hasExpectedSize.mockImplementation((embedding: number[]) => embedding.length === 768);
    chunks.insertMany.mockResolvedValue(undefined);
    chunks.search.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: getRepositoryToken(KnowledgeDocument), useValue: documents },
        { provide: KnowledgeChunkRepository, useValue: chunks },
      ],
    }).compile();
    service = module.get(KnowledgeService);
  });

  describe('split', () => {
    it('returns the chunks without writing anything', () => {
      const result = service.split(file('notes.md', 'text/markdown', 'Bonjour'));

      expect(result).toMatchObject({ name: 'notes.md', chunks: ['Bonjour'] });
      expect(documents.save).not.toHaveBeenCalled();
    });

    it('accepts a file recognised by its extension alone', () => {
      expect(() =>
        service.split(file('export.csv', 'application/octet-stream', 'a,b\n1,2')),
      ).not.toThrow();
    });

    it('rejects a binary format with guidance', () => {
      expect(() => service.split(file('contrat.pdf', 'application/pdf', '%PDF'))).toThrow(/PDF/);
    });

    it('rejects an empty document', () => {
      expect(() => service.split(file('vide.txt', 'text/plain', '   '))).toThrow(
        BadRequestException,
      );
    });

    it('rejects a document above the size limit', () => {
      const big = file('gros.txt', 'text/plain', 'a');
      big.size = 3 * 1024 * 1024;

      expect(() => service.split(big)).toThrow(/2 Mo/);
    });
  });

  describe('store', () => {
    it('writes the document then its chunks', async () => {
      const saved = await service.store('u1', document());

      expect(saved).toMatchObject({
        name: 'notes.md',
        chunkCount: 1,
        embeddingModel: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
      });
      expect(chunks.insertMany).toHaveBeenCalledWith('d1', document().chunks);
    });

    it('rejects vectors of the wrong size before touching the database', async () => {
      await expect(
        service.store('u1', document([{ content: 'Bonjour', embedding: [0.1, 0.2] }])),
      ).rejects.toThrow(/768 dimensions/);
      expect(documents.save).not.toHaveBeenCalled();
    });

    it('removes the document when its chunks cannot be written', async () => {
      chunks.insertMany.mockRejectedValue(new Error('disque plein'));

      await expect(service.store('u1', document())).rejects.toThrow('disque plein');
      expect(documents.delete).toHaveBeenCalledWith('d1');
    });
  });

  describe('contextFor', () => {
    const conversation = { folderId: 'f1' } as Conversation;

    it('scopes the search to the user and the folder', async () => {
      chunks.search.mockResolvedValue([{ content: 'Extrait', name: 'notes.md', score: 0.9 }]);

      const result = await service.contextFor('u1', conversation, vector());

      expect(chunks.search).toHaveBeenCalledWith('u1', 'f1', vector(), 5);
      expect(result).toContain('notes.md');
      expect(result).toContain('Extrait');
    });

    it('drops excerpts that are too far from the question', async () => {
      chunks.search.mockResolvedValue([{ content: 'Hors sujet', name: 'notes.md', score: 0.1 }]);

      expect(await service.contextFor('u1', conversation, vector())).toBeNull();
    });

    it('ignores a vector of the wrong size without searching', async () => {
      expect(await service.contextFor('u1', conversation, [0.1])).toBeNull();
      expect(chunks.search).not.toHaveBeenCalled();
    });

    it('answers without context when the search fails', async () => {
      chunks.search.mockRejectedValue(new Error('index corrompu'));

      expect(await service.contextFor('u1', conversation, vector())).toBeNull();
    });
  });

  describe('remove', () => {
    it('refuses to delete a document that belongs to someone else', async () => {
      documents.findOne.mockResolvedValue(null);

      await expect(service.remove('u1', 'd1')).rejects.toThrow('Document introuvable');
      expect(documents.delete).not.toHaveBeenCalled();
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { toPage } from '../../common/pagination.dto';
import { EMBEDDING_DIMENSIONS, KnowledgeDocument } from '../domain/knowledge-document';
import { KNOWLEDGE_REPOSITORY } from '../domain/knowledge.repository';
import {
  ListDocuments,
  RemoveDocument,
  RetrieveContext,
  SearchDocuments,
  StoreDocument,
} from './knowledge.use-cases';

const vector = (seed = 0.1) => Array.from({ length: EMBEDDING_DIMENSIONS }, () => seed);

const document = () =>
  KnowledgeDocument.rehydrate({
    id: 'd1',
    name: 'notes.md',
    mimeType: 'text/markdown',
    size: 7,
    chunkCount: 1,
    embeddingModel: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
    userId: 'u1',
    folderId: null,
    createdAt: new Date(),
  });

const input = (chunks = [{ content: 'Bonjour', embedding: vector() }]) => ({
  name: 'notes.md',
  mimeType: 'text/markdown',
  size: 7,
  embeddingModel: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
  chunks,
});

describe('Knowledge use cases', () => {
  const knowledge = {
    findOwned: jest.fn(),
    list: jest.fn(),
    save: jest.fn(() => Promise.resolve(document())),
    storeChunks: jest.fn(),
    search: jest.fn(),
    remove: jest.fn(),
  };

  let store: StoreDocument;
  let list: ListDocuments;
  let remove: RemoveDocument;
  let retrieve: RetrieveContext;
  let search: SearchDocuments;

  beforeEach(async () => {
    jest.clearAllMocks();
    knowledge.save.mockResolvedValue(document());
    knowledge.storeChunks.mockResolvedValue(undefined);
    knowledge.search.mockResolvedValue([]);
    knowledge.findOwned.mockResolvedValue(document());

    const module = await Test.createTestingModule({
      providers: [
        StoreDocument,
        ListDocuments,
        RemoveDocument,
        RetrieveContext,
        SearchDocuments,
        { provide: KNOWLEDGE_REPOSITORY, useValue: knowledge },
      ],
    }).compile();

    store = module.get(StoreDocument);
    list = module.get(ListDocuments);
    remove = module.get(RemoveDocument);
    retrieve = module.get(RetrieveContext);
    search = module.get(SearchDocuments);
  });

  describe('StoreDocument', () => {
    it('writes the document then its chunks', async () => {
      const saved = await store.execute('u1', input());

      expect(saved).toMatchObject({ name: 'notes.md', chunkCount: 1 });
      expect(knowledge.storeChunks).toHaveBeenCalledWith('d1', input().chunks);
    });

    it('rejects vectors of the wrong size before touching the database', async () => {
      await expect(
        store.execute('u1', input([{ content: 'Bonjour', embedding: [0.1, 0.2] }])),
      ).rejects.toThrow(/768 dimensions/);
      expect(knowledge.save).not.toHaveBeenCalled();
    });

    it('removes the document when its chunks cannot be written', async () => {
      knowledge.storeChunks.mockRejectedValue(new Error('disque plein'));

      await expect(store.execute('u1', input())).rejects.toThrow('disque plein');
      expect(knowledge.remove).toHaveBeenCalledWith('d1');
    });
  });

  describe('ListDocuments', () => {
    it('passes the folder filter through untouched', async () => {
      knowledge.list.mockResolvedValue(toPage([], 0));

      await list.execute('u1', 'f1', { limit: 5 });

      expect(knowledge.list).toHaveBeenCalledWith('u1', 'f1', { limit: 5 });
    });
  });

  describe('RetrieveContext', () => {
    it('scopes the search to the user and the folder', async () => {
      knowledge.search.mockResolvedValue([{ content: 'Extrait', name: 'notes.md', score: 0.9 }]);

      const result = await retrieve.execute('u1', 'f1', vector());

      expect(knowledge.search).toHaveBeenCalledWith('u1', 'f1', vector(), 5);
      expect(result).toContain('notes.md');
      expect(result).toContain('Extrait');
    });

    it('drops excerpts that are too far from the question', async () => {
      knowledge.search.mockResolvedValue([{ content: 'Hors sujet', name: 'notes.md', score: 0.1 }]);

      expect(await retrieve.execute('u1', 'f1', vector())).toBeNull();
    });

    it('ignores a vector of the wrong size without searching', async () => {
      expect(await retrieve.execute('u1', 'f1', [0.1])).toBeNull();
      expect(knowledge.search).not.toHaveBeenCalled();
    });

    it('answers without context when the search fails', async () => {
      knowledge.search.mockRejectedValue(new Error('index corrompu'));

      expect(await retrieve.execute('u1', 'f1', vector())).toBeNull();
    });
  });

  describe('SearchDocuments', () => {
    it('rend les extraits tels quels, sans seuil de pertinence', async () => {
      knowledge.search.mockResolvedValue([
        { content: 'Proche', name: 'notes.md', score: 0.9 },
        { content: 'Lointain', name: 'notes.md', score: 0.05 },
      ]);

      await expect(search.execute('u1', vector())).resolves.toHaveLength(2);
    });

    it('limite la recherche au dossier demandé', async () => {
      knowledge.search.mockResolvedValue([]);

      await search.execute('u1', vector(), { folderId: 'f1', limit: 3 });

      expect(knowledge.search).toHaveBeenCalledWith('u1', 'f1', vector(), 3);
    });

    it('cherche dans tout le compte quand aucun dossier n’est donné', async () => {
      knowledge.search.mockResolvedValue([]);

      await search.execute('u1', vector());

      expect(knowledge.search).toHaveBeenCalledWith('u1', null, vector(), 10);
    });

    it('refuse un vecteur de mauvaise taille au lieu d’interroger la base', async () => {
      await expect(search.execute('u1', [0.1])).rejects.toThrow(/768 dimensions/);
      expect(knowledge.search).not.toHaveBeenCalled();
    });
  });

  describe('RemoveDocument', () => {
    it('refuses to delete a document that belongs to someone else', async () => {
      knowledge.findOwned.mockResolvedValue(null);

      await expect(remove.execute('u1', 'd1')).rejects.toThrow(NotFoundException);
      expect(knowledge.remove).not.toHaveBeenCalled();
    });
  });
});

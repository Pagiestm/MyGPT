import { DomainError } from '../../common/domain/domain-error';
import { EMBEDDING_DIMENSIONS, KnowledgeDocument, MAX_DOCUMENT_SIZE } from './knowledge-document';

const file = (name: string, mimeType: string, content: string) => ({
  name,
  mimeType,
  size: Buffer.byteLength(content),
  data: Buffer.from(content),
});

const vector = (seed = 0.1) => Array.from({ length: EMBEDDING_DIMENSIONS }, () => seed);

const indexed = (chunks = [{ content: 'Bonjour', embedding: vector() }]) => ({
  userId: 'u1',
  name: 'notes.md',
  mimeType: 'text/markdown',
  size: 7,
  embeddingModel: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
  chunks,
});

describe('KnowledgeDocument', () => {
  describe('split', () => {
    it('returns the chunks of a text document', () => {
      expect(KnowledgeDocument.split(file('notes.md', 'text/markdown', 'Bonjour'))).toMatchObject({
        name: 'notes.md',
        chunks: ['Bonjour'],
      });
    });

    it('accepts a file recognised by its extension alone', () => {
      expect(() =>
        KnowledgeDocument.split(file('export.csv', 'application/octet-stream', 'a,b\n1,2')),
      ).not.toThrow();
    });

    it('rejects a binary format with guidance', () => {
      expect(() => KnowledgeDocument.split(file('contrat.pdf', 'application/pdf', '%PDF'))).toThrow(
        /PDF/,
      );
    });

    it('rejects an empty document', () => {
      expect(() => KnowledgeDocument.split(file('vide.txt', 'text/plain', '   '))).toThrow(
        DomainError,
      );
    });

    it('rejects a document above the size limit', () => {
      const big = file('gros.txt', 'text/plain', 'a');
      big.size = MAX_DOCUMENT_SIZE + 1;

      expect(() => KnowledgeDocument.split(big)).toThrow(/2 Mo/);
    });

    it('falls back to text/plain when the browser sends no type', () => {
      expect(KnowledgeDocument.split(file('notes.txt', '', 'Bonjour')).mimeType).toBe('text/plain');
    });
  });

  describe('index', () => {
    it('counts its own chunks', () => {
      const document = KnowledgeDocument.index(
        indexed([
          { content: 'a', embedding: vector() },
          { content: 'b', embedding: vector() },
        ]),
      );

      expect(document.chunkCount).toBe(2);
    });

    it('rejects vectors of the wrong size', () => {
      expect(() =>
        KnowledgeDocument.index(indexed([{ content: 'Bonjour', embedding: [0.1, 0.2] }])),
      ).toThrow(/768 dimensions/);
    });

    it('belongs to the whole account when no folder is given', () => {
      expect(KnowledgeDocument.index(indexed()).folderId).toBeNull();
    });
  });

  it('only accepts a question vector of the indexing size', () => {
    expect(KnowledgeDocument.isUsableEmbedding(vector())).toBe(true);
    expect(KnowledgeDocument.isUsableEmbedding([0.1])).toBe(false);
  });
});

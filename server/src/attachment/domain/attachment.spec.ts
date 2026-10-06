import { DomainError } from '../../common/domain/domain-error';
import { Attachment, MAX_FILE_SIZE } from './attachment';

const file = (name: string, mimeType: string, content = 'x') => ({
  name,
  mimeType,
  size: Buffer.byteLength(content),
  data: Buffer.from(content),
});

describe('Attachment', () => {
  it('keeps a type a model can handle natively', () => {
    expect(Attachment.accept('u1', file('schema.png', 'image/png')).mimeType).toBe('image/png');
    expect(Attachment.accept('u1', file('contrat.pdf', 'application/pdf')).mimeType).toBe(
      'application/pdf',
    );
  });

  it('normalises any text format to text/plain', () => {
    expect(Attachment.accept('u1', file('notes.md', 'text/markdown')).mimeType).toBe('text/plain');
  });

  it('accepts a file recognised by its extension alone', () => {
    expect(Attachment.accept('u1', file('app.ts', 'application/octet-stream')).mimeType).toBe(
      'text/plain',
    );
  });

  it('refuses a format nothing can read', () => {
    expect(() => Attachment.accept('u1', file('archive.zip', 'application/zip'))).toThrow(
      DomainError,
    );
  });

  it('refuses a file above the size limit', () => {
    const big = file('gros.txt', 'text/plain');
    big.size = MAX_FILE_SIZE + 1;

    expect(() => Attachment.accept('u1', big)).toThrow(/10 Mo/);
  });

  it('refuses more than five files on a single message', () => {
    expect(() => Attachment.assertBatchSize(5)).not.toThrow();
    expect(() => Attachment.assertBatchSize(6)).toThrow(/5 fichiers maximum/);
  });

  it('starts unattached and belongs to its uploader alone', () => {
    const attachment = Attachment.accept('u1', file('notes.md', 'text/markdown'));

    expect(attachment.messageId).toBeNull();
    expect(attachment.belongsTo('u1')).toBe(true);
    expect(attachment.belongsTo('u2')).toBe(false);
    expect(attachment.belongsTo(undefined)).toBe(false);
  });

  it('knows which files a browser model can actually read', () => {
    expect(Attachment.accept('u1', file('notes.md', 'text/markdown')).isReadableByAi).toBe(true);
    expect(Attachment.accept('u1', file('schema.png', 'image/png')).isReadableByAi).toBe(false);
    expect(Attachment.accept('u1', file('contrat.pdf', 'application/pdf')).isReadableByAi).toBe(
      false,
    );
  });
});

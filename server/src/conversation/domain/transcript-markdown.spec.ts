import { Conversation } from './conversation';
import type { TranscriptEntry } from './conversation-transcript';
import { toFileName, toMarkdown } from './transcript-markdown';

const conversation = (name = 'Comment fonctionne NestJS ?') =>
  Conversation.rehydrate({
    id: 'c1',
    name,
    userId: 'u1',
    sharedFrom: null,
    isPublic: false,
    shareLink: null,
    shareExpiresAt: null,
    pinned: false,
    archived: false,
    titleLocked: true,
    folderId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const entry = (content: string, isFromAi: boolean): TranscriptEntry => ({
  id: 'm1',
  content,
  isFromAi,
  model: isFromAi ? 'webgpu:x' : null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('toMarkdown', () => {
  it('ouvre sur le titre de la conversation', () => {
    expect(toMarkdown(conversation(), [])).toContain('# Comment fonctionne NestJS ?');
  });

  it('distingue qui parle', () => {
    const markdown = toMarkdown(conversation(), [
      entry('Explique les modules', false),
      entry('Un module regroupe...', true),
    ]);

    expect(markdown).toContain('## Vous');
    expect(markdown).toContain('## Assistant');
  });

  it('garde les messages dans l’ordre reçu', () => {
    const markdown = toMarkdown(conversation(), [
      entry('première', false),
      entry('deuxième', true),
    ]);

    expect(markdown.indexOf('première')).toBeLessThan(markdown.indexOf('deuxième'));
  });

  it('préserve le Markdown des réponses sans l’échapper', () => {
    const markdown = toMarkdown(conversation(), [entry('```ts\nconst a = 1;\n```', true)]);

    expect(markdown).toContain('```ts');
  });

  it('se termine par une seule fin de ligne', () => {
    expect(toMarkdown(conversation(), [entry('Bonjour', false)])).toMatch(/[^\n]\n$/);
  });
});

describe('toFileName', () => {
  it('transforme le titre en nom de fichier lisible', () => {
    expect(toFileName(conversation('Comment fonctionne NestJS ?'))).toBe(
      'comment-fonctionne-nestjs.md',
    );
  });

  it('retire les accents', () => {
    expect(toFileName(conversation('Déjà vu'))).toBe('deja-vu.md');
  });

  it('retombe sur un nom générique quand le titre ne donne rien', () => {
    expect(toFileName(conversation('???'))).toBe('conversation.md');
  });

  it('borne la longueur du nom', () => {
    expect(toFileName(conversation('a'.repeat(200))).length).toBeLessThanOrEqual(63);
  });
});

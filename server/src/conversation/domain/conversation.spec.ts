import { DomainError } from '../../common/domain/domain-error';
import { Conversation } from './conversation';

const conversation = (overrides: Partial<Parameters<typeof Conversation.rehydrate>[0]> = {}) =>
  Conversation.rehydrate({
    id: 'c1',
    name: 'NestJS',
    userId: 'u1',
    sharedFrom: null,
    isPublic: false,
    shareLink: null,
    shareExpiresAt: null,
    pinned: false,
    archived: false,
    titleLocked: false,
    folderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('Conversation', () => {
  it('starts private, unpinned and with a free title', () => {
    const fresh = Conversation.start({ userId: 'u1', name: 'NestJS' });

    expect(fresh.isPublic).toBe(false);
    expect(fresh.pinned).toBe(false);
    expect(fresh.titleLocked).toBe(false);
    expect(fresh.shareLink).toBeNull();
  });

  it('refuses a blank title', () => {
    expect(() => Conversation.start({ userId: 'u1', name: '   ' })).toThrow(DomainError);
  });

  it('locks the title once someone renames it', () => {
    const existing = conversation();

    existing.rename('  Nest avancé  ');

    expect(existing.name).toBe('Nest avancé');
    expect(existing.titleLocked).toBe(true);
  });

  it('only its owner reads a private conversation', () => {
    const existing = conversation();

    expect(existing.isReadableBy('u1')).toBe(true);
    expect(existing.isReadableBy('u2')).toBe(false);
    expect(existing.isReadableBy(undefined)).toBe(false);
  });

  it('a public conversation is readable by anyone', () => {
    expect(conversation({ isPublic: true }).isReadableBy(undefined)).toBe(true);
  });

  it('generates a share link only once', () => {
    const existing = conversation();

    existing.share();
    const first = existing.shareLink;
    existing.share();

    expect(first).toMatch(/^[0-9a-f]{16}$/);
    expect(existing.shareLink).toBe(first);
  });

  it('an expired link no longer shares anything', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const existing = conversation({ shareLink: 'abc', shareExpiresAt: yesterday });

    expect(existing.isShared()).toBe(false);
    expect(existing.isReadableBy('u2')).toBe(false);
  });

  it('a link without an expiry date shares indefinitely', () => {
    expect(conversation({ shareLink: 'abc' }).isShared()).toBe(true);
  });

  it('revoking a share clears both the link and its expiry', () => {
    const existing = conversation({ shareLink: 'abc', shareExpiresAt: new Date() });

    existing.revokeShare();

    expect(existing.shareLink).toBeNull();
    expect(existing.shareExpiresAt).toBeNull();
  });

  it('applies only the fields the request mentions', () => {
    const existing = conversation({ pinned: true, folderId: 'f1' });

    existing.apply({ archived: true });

    expect(existing.archived).toBe(true);
    expect(existing.pinned).toBe(true);
    expect(existing.folderId).toBe('f1');
    expect(existing.titleLocked).toBe(false);
  });

  it('takes a conversation out of its folder when told to', () => {
    const existing = conversation({ folderId: 'f1' });

    existing.apply({ folderId: null });

    expect(existing.folderId).toBeNull();
  });

  it('a copy belongs to its new owner and keeps no share of its own', () => {
    const shared = conversation({ shareLink: 'abc', pinned: true, folderId: 'f1' });

    const copy = shared.copyFor('u2');

    expect(copy.userId).toBe('u2');
    expect(copy.sharedFrom).toBe('c1');
    expect(copy.name).toBe('NestJS (Copie)');
    expect(copy.shareLink).toBeNull();
    expect(copy.pinned).toBe(false);
    expect(copy.folderId).toBeNull();
  });

  it('honours the name chosen for a copy', () => {
    expect(conversation().copyFor('u2', 'Ma copie').name).toBe('Ma copie');
  });
});

import { randomBytes } from 'crypto';
import { DomainError } from '../../common/domain/domain-error';

const SHARE_TOKEN_BYTES = 8;

export interface ConversationState {
  id: string;
  name: string;
  userId: string;
  sharedFrom: string | null;
  isPublic: boolean;
  shareLink: string | null;
  shareExpiresAt: Date | null;
  pinned: boolean;
  archived: boolean;
  titleLocked: boolean;
  folderId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationChanges {
  name?: string;
  isPublic?: boolean;
  pinned?: boolean;
  archived?: boolean;
  folderId?: string | null;
}

export class Conversation {
  private constructor(
    readonly id: string,
    public name: string,
    readonly userId: string,
    readonly sharedFrom: string | null,
    public isPublic: boolean,
    public shareLink: string | null,
    public shareExpiresAt: Date | null,
    public pinned: boolean,
    public archived: boolean,
    public titleLocked: boolean,
    public folderId: string | null,
    private trashedAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static start(input: {
    userId: string;
    name: string;
    isPublic?: boolean;
    folderId?: string | null;
  }): Conversation {
    const now = new Date();
    return new Conversation(
      '',
      Conversation.cleanName(input.name),
      input.userId,
      null,
      input.isPublic ?? false,
      null,
      null,
      false,
      false,
      false,
      input.folderId ?? null,
      null,
      now,
      now,
    );
  }

  static rehydrate(state: ConversationState): Conversation {
    return new Conversation(
      state.id,
      state.name,
      state.userId,
      state.sharedFrom,
      state.isPublic,
      state.shareLink,
      state.shareExpiresAt,
      state.pinned,
      state.archived,
      state.titleLocked,
      state.folderId,
      state.deletedAt,
      state.createdAt,
      state.updatedAt,
    );
  }

  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  get deletedAt(): Date | null {
    return this.trashedAt;
  }

  get isTrashed(): boolean {
    return this.trashedAt !== null;
  }

  moveToTrash(now = new Date()): void {
    this.trashedAt = now;
    this.pinned = false;
    this.revokeShare();
  }

  restore(): void {
    this.trashedAt = null;
  }

  isReadableBy(userId: string | undefined, now = new Date()): boolean {
    if (this.isTrashed) return !!userId && this.belongsTo(userId);
    return (!!userId && this.belongsTo(userId)) || this.isPublic || this.isShared(now);
  }

  isShared(now = new Date()): boolean {
    if (!this.shareLink) return false;
    return !this.shareExpiresAt || new Date(this.shareExpiresAt) > now;
  }

  apply(changes: ConversationChanges): void {
    if (changes.name !== undefined) this.rename(changes.name);
    if (changes.isPublic !== undefined) this.isPublic = changes.isPublic;
    if (changes.pinned !== undefined) this.pinned = changes.pinned;
    if (changes.archived !== undefined) this.archived = changes.archived;
    if (changes.folderId !== undefined) this.folderId = changes.folderId;
  }

  rename(name: string): void {
    this.name = Conversation.cleanName(name);
    this.titleLocked = true;
  }

  titleAutomatically(name: string): void {
    this.name = Conversation.cleanName(name);
    this.titleLocked = true;
  }

  share(expiresAt?: string | Date | null): void {
    this.shareLink ??= randomBytes(SHARE_TOKEN_BYTES).toString('hex');
    if (expiresAt) this.shareExpiresAt = new Date(expiresAt);
  }

  revokeShare(): void {
    this.shareLink = null;
    this.shareExpiresAt = null;
  }

  copyFor(userId: string, newName?: string): Conversation {
    const now = new Date();
    return new Conversation(
      '',
      Conversation.cleanName(newName || `${this.name} (Copie)`),
      userId,
      this.id,
      false,
      null,
      null,
      false,
      false,
      false,
      null,
      null,
      now,
      now,
    );
  }

  private static cleanName(name: string): string {
    const cleaned = name.trim();
    if (!cleaned) throw new DomainError('Le titre de la conversation est requis');
    return cleaned;
  }
}

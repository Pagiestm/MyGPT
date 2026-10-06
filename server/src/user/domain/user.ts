import { DomainError } from '../../common/domain/domain-error';
import { UserRole } from './user-role.enum';

const PSEUDO_MIN = 3;
const PSEUDO_MAX = 20;

export interface UserState {
  id: string;
  email: string;
  pseudo: string;
  passwordHash: string | null;
  googleId: string | null;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  role: UserRole;
  customInstructions: string | null;
  preferredModel: string | null;
  createdAt: Date;
}

export class User {
  private constructor(
    readonly id: string,
    public email: string,
    public pseudo: string,
    public passwordHash: string | null,
    public googleId: string | null,
    private resetTokenHash: string | null,
    private resetTokenExpiresAt: Date | null,
    public role: UserRole,
    public customInstructions: string | null,
    public preferredModel: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    email: string;
    pseudo: string;
    passwordHash?: string | null;
    googleId?: string | null;
  }): User {
    return new User(
      '',
      input.email.trim(),
      User.cleanPseudo(input.pseudo),
      input.passwordHash ?? null,
      input.googleId ?? null,
      null,
      null,
      UserRole.User,
      null,
      null,
      new Date(),
    );
  }

  static rehydrate(state: UserState): User {
    return new User(
      state.id,
      state.email,
      state.pseudo,
      state.passwordHash,
      state.googleId,
      state.resetTokenHash,
      state.resetTokenExpiresAt,
      state.role,
      state.customInstructions,
      state.preferredModel,
      state.createdAt,
    );
  }

  get isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  get signsInWithPassword(): boolean {
    return !!this.passwordHash;
  }

  linkGoogle(googleId: string): void {
    this.googleId = googleId;
  }

  get pendingReset(): { tokenHash: string; expiresAt: Date } | null {
    if (!this.resetTokenHash || !this.resetTokenExpiresAt) return null;
    return { tokenHash: this.resetTokenHash, expiresAt: this.resetTokenExpiresAt };
  }

  changeEmail(email: string): void {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) throw new DomainError("L'email est requis");
    this.email = cleaned;
  }

  changePassword(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.forgetReset();
  }

  openReset(tokenHash: string, expiresAt: Date): void {
    if (!this.passwordHash && this.googleId) {
      throw new DomainError(
        'Ce compte se connecte avec Google : il n’a pas de mot de passe à réinitialiser',
      );
    }
    this.resetTokenHash = tokenHash;
    this.resetTokenExpiresAt = expiresAt;
  }

  acceptsReset(tokenHash: string, now = new Date()): boolean {
    if (!this.resetTokenHash || !this.resetTokenExpiresAt) return false;
    return this.resetTokenHash === tokenHash && this.resetTokenExpiresAt > now;
  }

  forgetReset(): void {
    this.resetTokenHash = null;
    this.resetTokenExpiresAt = null;
  }

  rename(pseudo: string): void {
    this.pseudo = User.cleanPseudo(pseudo);
  }

  guideWith(instructions: string | null | undefined): void {
    this.customInstructions = instructions?.trim() || null;
  }

  prefer(model: string | null | undefined): void {
    this.preferredModel = model ?? null;
  }

  assign(role: UserRole): void {
    this.role = role;
  }

  losesAdminRights(role: UserRole): boolean {
    return this.isAdmin && role !== UserRole.Admin;
  }

  static pseudoFrom(suggestion: string): string {
    const cleaned = suggestion
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, PSEUDO_MAX);
    return cleaned.length >= PSEUDO_MIN ? cleaned : `membre_${cleaned}`.slice(0, PSEUDO_MAX);
  }

  private static cleanPseudo(pseudo: string): string {
    const cleaned = pseudo.trim();
    if (!cleaned) throw new DomainError('Le pseudo est requis');
    return cleaned;
  }
}

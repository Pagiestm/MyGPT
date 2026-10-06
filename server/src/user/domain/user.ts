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
  role: UserRole;
  customInstructions: string | null;
  preferredModel: string | null;
  createdAt: Date;
}

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    public pseudo: string,
    readonly passwordHash: string | null,
    public googleId: string | null,
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

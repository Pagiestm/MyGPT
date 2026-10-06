import { DomainError } from '../../common/domain/domain-error';
import { UserRole } from './user-role.enum';

export interface UserState {
  id: string;
  email: string;
  pseudo: string;
  passwordHash: string;
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
    readonly passwordHash: string,
    public role: UserRole,
    public customInstructions: string | null,
    public preferredModel: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: { email: string; pseudo: string; passwordHash: string }): User {
    return new User(
      '',
      input.email.trim(),
      User.cleanPseudo(input.pseudo),
      input.passwordHash,
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
      state.role,
      state.customInstructions,
      state.preferredModel,
      state.createdAt,
    );
  }

  get isAdmin(): boolean {
    return this.role === UserRole.Admin;
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

  private static cleanPseudo(pseudo: string): string {
    const cleaned = pseudo.trim();
    if (!cleaned) throw new DomainError('Le pseudo est requis');
    return cleaned;
  }
}

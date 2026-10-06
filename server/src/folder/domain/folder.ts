import { DomainError } from '../../common/domain/domain-error';

export class Folder {
  private constructor(
    readonly id: string,
    readonly userId: string,
    public name: string,
    public instructions: string | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(userId: string, name: string, instructions?: string | null): Folder {
    const now = new Date();
    return new Folder('', userId, Folder.cleanName(name), instructions?.trim() || null, now, now);
  }

  static rehydrate(state: {
    id: string;
    userId: string;
    name: string;
    instructions: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Folder {
    return new Folder(
      state.id,
      state.userId,
      state.name,
      state.instructions,
      state.createdAt,
      state.updatedAt,
    );
  }

  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  rename(name: string): void {
    this.name = Folder.cleanName(name);
  }

  guideWith(instructions: string | null | undefined): void {
    this.instructions = instructions?.trim() || null;
  }

  private static cleanName(name: string): string {
    const cleaned = name.trim();
    if (!cleaned) throw new DomainError('Le nom du dossier est requis');
    return cleaned;
  }
}

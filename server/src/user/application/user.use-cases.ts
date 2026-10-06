import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Page, PaginationDto } from '../../common/pagination.dto';
import { User } from '../domain/user';
import { UserRole } from '../domain/user-role.enum';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';

@Injectable()
export class GetUser {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    return user;
  }
}

@Injectable()
export class GetUserByEmail {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(email: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException(`Aucun utilisateur trouvé avec l'email ${email}`);
    return user;
  }
}

@Injectable()
export class RegisterUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { email: string; pseudo: string; password: string }): Promise<User> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    if (await this.users.findByPseudo(input.pseudo)) {
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }
    const passwordHash = await this.hasher.hash(input.password);
    return this.users.save(User.create({ ...input, passwordHash }));
  }
}

@Injectable()
export class ChangePseudo {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly get: GetUser,
  ) {}

  async execute(userId: string, pseudo: string): Promise<{ changed: boolean }> {
    const user = await this.get.execute(userId);
    if (pseudo === user.pseudo) return { changed: false };

    if (await this.users.findByPseudo(pseudo)) {
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }
    user.rename(pseudo);
    await this.users.save(user);
    return { changed: true };
  }
}

@Injectable()
export class UpdatePreferences {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly get: GetUser,
  ) {}

  async execute(
    userId: string,
    input: { customInstructions?: string; preferredModel?: string | null },
  ): Promise<User> {
    const user = await this.get.execute(userId);
    if (input.customInstructions !== undefined) user.guideWith(input.customInstructions);
    if (input.preferredModel !== undefined) user.prefer(input.preferredModel);
    return this.users.save(user);
  }
}

@Injectable()
export class DeleteAccount {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly get: GetUser,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.get.execute(userId);
    await this.users.remove(user.id);
  }
}

@Injectable()
export class ListUsers {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(pagination: PaginationDto = {}): Promise<Page<User>> {
    return this.users.list(pagination);
  }
}

@Injectable()
export class ChangeRole {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(id: string, role: UserRole): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (user.losesAdminRights(role) && (await this.users.countAdmins()) <= 1) {
      throw new BadRequestException(
        "Impossible de retirer le dernier administrateur de l'instance",
      );
    }

    user.assign(role);
    return this.users.save(user);
  }
}

@Injectable()
export class VerifyCredentials {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<User | null> {
    const user = await this.users.findByEmail(email);
    if (!user?.passwordHash) return null;
    return (await this.hasher.matches(password, user.passwordHash)) ? user : null;
  }
}

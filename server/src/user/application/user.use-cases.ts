import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Page, PaginationDto } from '../../common/http/pagination.dto';
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

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
}

@Injectable()
export class SignInWithGoogle {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(profile: GoogleProfile): Promise<User> {
    const known = await this.users.findByGoogleId(profile.googleId);
    if (known) return known;

    const sameEmail = await this.users.findByEmail(profile.email);
    if (sameEmail) {
      sameEmail.linkGoogle(profile.googleId);
      return this.users.save(sameEmail);
    }

    return this.users.save(
      User.create({
        email: profile.email,
        pseudo: await this.freePseudo(profile.displayName || profile.email.split('@')[0] || ''),
        googleId: profile.googleId,
      }),
    );
  }

  private async freePseudo(suggestion: string): Promise<string> {
    const base = User.pseudoFrom(suggestion);
    if (!(await this.users.findByPseudo(base))) return base;

    for (let suffix = 2; suffix < 1000; suffix++) {
      const candidate = `${base.slice(0, 20 - String(suffix).length - 1)}_${suffix}`;
      if (!(await this.users.findByPseudo(candidate))) return candidate;
    }
    throw new ConflictException('Impossible de trouver un pseudo disponible');
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
export class ChangePassword {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly get: GetUser,
  ) {}

  async execute(userId: string, current: string, next: string): Promise<void> {
    const user = await this.get.execute(userId);

    if (!user.passwordHash || !(await this.hasher.matches(current, user.passwordHash))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    user.changePassword(await this.hasher.hash(next));
    await this.users.save(user);
  }
}

@Injectable()
export class ChangeEmail {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly get: GetUser,
  ) {}

  async execute(userId: string, email: string, password: string): Promise<User> {
    const user = await this.get.execute(userId);

    if (!user.passwordHash || !(await this.hasher.matches(password, user.passwordHash))) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    const taken = await this.users.findByEmail(email.trim().toLowerCase());
    if (taken && taken.id !== user.id) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    user.changeEmail(email);
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

import { createHash, randomBytes } from 'crypto';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER, type Mailer } from '../../common/mail/mailer';
import { renderMail } from '../../common/mail/render';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';

const TOKEN_BYTES = 32;
const VALID_FOR_MS = 3_600_000;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RequestPasswordReset {
  private readonly logger = new Logger(RequestPasswordReset.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async execute(email: string, clientUrl: string): Promise<void> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user?.passwordHash) return;

    const token = randomBytes(TOKEN_BYTES).toString('hex');
    user.openReset(hashToken(token), new Date(Date.now() + VALID_FOR_MS));
    await this.users.save(user);

    try {
      await this.mailer.send({
        to: user.email,
        subject: 'Réinitialiser votre mot de passe MyGPT',
        html: await renderMail('password-reset', {
          pseudo: user.pseudo,
          link: `${clientUrl}/reinitialiser/${token}`,
        }),
      });
    } catch (error) {
      this.logger.error(`Envoi du courriel impossible : ${(error as Error).message}`);
    }
  }
}

@Injectable()
export class ResetPassword {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const user = await this.users.findByResetToken(tokenHash);

    if (!user?.acceptsReset(tokenHash)) {
      throw new BadRequestException('Ce lien est expiré ou a déjà servi');
    }

    user.changePassword(await this.hasher.hash(password));
    await this.users.save(user);
  }
}

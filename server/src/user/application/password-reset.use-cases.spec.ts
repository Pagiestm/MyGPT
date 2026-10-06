import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MAILER } from '../../common/mail/mailer';
import { PASSWORD_HASHER } from '../domain/password-hasher';
import { USER_REPOSITORY } from '../domain/user.repository';
import { User } from '../domain/user';
import { UserRole } from '../domain/user-role.enum';
import { RequestPasswordReset, ResetPassword, hashToken } from './password-reset.use-cases';

const account = (overrides: Partial<Parameters<typeof User.rehydrate>[0]> = {}) =>
  User.rehydrate({
    id: 'u1',
    email: 'alice@example.com',
    pseudo: 'alice',
    passwordHash: 'hashed',
    googleId: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    role: UserRole.User,
    customInstructions: null,
    preferredModel: null,
    createdAt: new Date(),
    ...overrides,
  });

describe('Réinitialisation du mot de passe', () => {
  const users = {
    findByEmail: jest.fn(),
    findByResetToken: jest.fn(),
    save: jest.fn((saved: User) => Promise.resolve(saved)),
  };
  const mailer = { available: true, send: jest.fn() };
  const hasher = { hash: jest.fn(), matches: jest.fn() };

  let request: RequestPasswordReset;
  let reset: ResetPassword;

  beforeEach(async () => {
    jest.clearAllMocks();
    hasher.hash.mockResolvedValue('nouveau-hash');
    mailer.send.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        RequestPasswordReset,
        ResetPassword,
        { provide: USER_REPOSITORY, useValue: users },
        { provide: MAILER, useValue: mailer },
        { provide: PASSWORD_HASHER, useValue: hasher },
      ],
    }).compile();

    request = module.get(RequestPasswordReset);
    reset = module.get(ResetPassword);
  });

  describe('RequestPasswordReset', () => {
    it('envoie un lien contenant un jeton qui n’est pas celui stocké', async () => {
      users.findByEmail.mockResolvedValue(account());

      await request.execute('alice@example.com', 'https://mygpt.fr');

      const envoye = mailer.send.mock.calls[0]![0] as { html: string };
      const jeton = /reinitialiser\/([0-9a-f]+)/.exec(envoye.html)?.[1] ?? '';
      const enregistre = (users.save.mock.calls[0]![0] as User).pendingReset?.tokenHash;

      expect(jeton).toHaveLength(64);
      expect(enregistre).toBe(hashToken(jeton));
      expect(enregistre).not.toBe(jeton);
    });

    it('envoie un courriel HTML, lisible sur toutes les messageries', async () => {
      users.findByEmail.mockResolvedValue(account());

      await request.execute('alice@example.com', 'https://mygpt.fr');

      const envoye = mailer.send.mock.calls[0]![0] as { html: string; subject: string };
      expect(envoye.html).toContain('<!doctype html>');
      expect(envoye.html).toContain('alice');
      expect(envoye.subject).toContain('mot de passe');
    });

    it('ne révèle rien quand l’email est inconnu', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        request.execute('absent@example.com', 'https://mygpt.fr'),
      ).resolves.toBeUndefined();
      expect(mailer.send).not.toHaveBeenCalled();
      expect(users.save).not.toHaveBeenCalled();
    });

    it('ignore un compte qui se connecte uniquement avec Google', async () => {
      users.findByEmail.mockResolvedValue(account({ passwordHash: null, googleId: 'g-1' }));

      await request.execute('alice@example.com', 'https://mygpt.fr');

      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('n’échoue pas quand le courriel ne part pas', async () => {
      users.findByEmail.mockResolvedValue(account());
      mailer.send.mockRejectedValue(new Error('SMTP injoignable'));

      await expect(
        request.execute('alice@example.com', 'https://mygpt.fr'),
      ).resolves.toBeUndefined();
    });
  });

  describe('ResetPassword', () => {
    const avecJeton = (token: string, expiresAt: Date) => {
      const user = account();
      user.openReset(hashToken(token), expiresAt);
      return user;
    };

    it('remplace le mot de passe et consomme le jeton', async () => {
      const user = avecJeton('bon-jeton', new Date(Date.now() + 60_000));
      users.findByResetToken.mockResolvedValue(user);

      await reset.execute('bon-jeton', 'N0uveau@Mdp1');

      expect(user.passwordHash).toBe('nouveau-hash');
      expect(user.pendingReset).toBeNull();
    });

    it('refuse un jeton expiré', async () => {
      users.findByResetToken.mockResolvedValue(
        avecJeton('vieux-jeton', new Date(Date.now() - 1000)),
      );

      await expect(reset.execute('vieux-jeton', 'N0uveau@Mdp1')).rejects.toThrow(
        BadRequestException,
      );
      expect(users.save).not.toHaveBeenCalled();
    });

    it('refuse un jeton inconnu', async () => {
      users.findByResetToken.mockResolvedValue(null);

      await expect(reset.execute('invente', 'N0uveau@Mdp1')).rejects.toThrow(
        /expiré ou a déjà servi/,
      );
    });

    it('refuse de resservir un jeton déjà consommé', async () => {
      const user = avecJeton('bon-jeton', new Date(Date.now() + 60_000));
      users.findByResetToken.mockResolvedValue(user);
      await reset.execute('bon-jeton', 'N0uveau@Mdp1');

      await expect(reset.execute('bon-jeton', 'Encore@Mdp12')).rejects.toThrow(BadRequestException);
    });
  });
});

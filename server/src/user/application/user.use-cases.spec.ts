import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { toPage } from '../../common/http/pagination.dto';
import { User } from '../domain/user';
import { UserRole } from '../domain/user-role.enum';
import { PASSWORD_HASHER } from '../domain/password-hasher';
import { USER_REPOSITORY } from '../domain/user.repository';
import {
  ChangeEmail,
  ChangePassword,
  ChangePseudo,
  ChangeRole,
  DeleteAccount,
  GetUser,
  GetUserByEmail,
  ListUsers,
  RegisterUser,
  SignInWithGoogle,
  UpdatePreferences,
  VerifyCredentials,
} from './user.use-cases';

const account = (overrides: Partial<Parameters<typeof User.rehydrate>[0]> = {}) =>
  User.rehydrate({
    id: 'u1',
    email: 'alice@example.com',
    pseudo: 'alice42',
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

describe('User use cases', () => {
  const users = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByPseudo: jest.fn(),
    findByGoogleId: jest.fn(),
    findByResetToken: jest.fn(),
    list: jest.fn(),
    countAdmins: jest.fn(),
    save: jest.fn((saved: User) => Promise.resolve(saved)),
    remove: jest.fn(),
  };
  const hasher = { hash: jest.fn(), matches: jest.fn() };

  let get: GetUser;
  let byEmail: GetUserByEmail;
  let register: RegisterUser;
  let pseudo: ChangePseudo;
  let preferences: UpdatePreferences;
  let remove: DeleteAccount;
  let list: ListUsers;
  let role: ChangeRole;
  let credentials: VerifyCredentials;
  let google: SignInWithGoogle;
  let password: ChangePassword;
  let emailChange: ChangeEmail;

  beforeEach(async () => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue(account());
    users.findByEmail.mockResolvedValue(null);
    users.findByPseudo.mockResolvedValue(null);
    users.findByGoogleId.mockResolvedValue(null);
    hasher.hash.mockResolvedValue('hashed');

    const module = await Test.createTestingModule({
      providers: [
        GetUser,
        GetUserByEmail,
        RegisterUser,
        ChangePseudo,
        UpdatePreferences,
        DeleteAccount,
        ListUsers,
        ChangeRole,
        VerifyCredentials,
        SignInWithGoogle,
        ChangePassword,
        ChangeEmail,
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PASSWORD_HASHER, useValue: hasher },
      ],
    }).compile();

    get = module.get(GetUser);
    byEmail = module.get(GetUserByEmail);
    register = module.get(RegisterUser);
    pseudo = module.get(ChangePseudo);
    preferences = module.get(UpdatePreferences);
    remove = module.get(DeleteAccount);
    list = module.get(ListUsers);
    role = module.get(ChangeRole);
    credentials = module.get(VerifyCredentials);
    google = module.get(SignInWithGoogle);
    password = module.get(ChangePassword);
    emailChange = module.get(ChangeEmail);
  });

  describe('GetUser', () => {
    it('reports an unknown account', async () => {
      users.findById.mockResolvedValue(null);

      await expect(get.execute('absent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('GetUserByEmail', () => {
    it('reports an unknown email', async () => {
      await expect(byEmail.execute('absent@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('RegisterUser', () => {
    const input = { email: 'alice@example.com', pseudo: 'alice42', password: 'P@ssw0rd123' };

    it('never stores the password in clear', async () => {
      const created = await register.execute(input);

      expect(hasher.hash).toHaveBeenCalledWith('P@ssw0rd123');
      expect(created.passwordHash).toBe('hashed');
      expect(created.passwordHash).not.toBe('P@ssw0rd123');
    });

    it('refuses an email already taken', async () => {
      users.findByEmail.mockResolvedValue(account());

      await expect(register.execute(input)).rejects.toThrow(ConflictException);
      expect(hasher.hash).not.toHaveBeenCalled();
    });

    it('refuses a pseudo already taken', async () => {
      users.findByPseudo.mockResolvedValue(account());

      await expect(register.execute(input)).rejects.toThrow(ConflictException);
    });
  });

  describe('ChangePseudo', () => {
    it('saves nothing when the pseudo is unchanged', async () => {
      const result = await pseudo.execute('u1', 'alice42');

      expect(result.changed).toBe(false);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('refuses a pseudo someone else already uses', async () => {
      users.findByPseudo.mockResolvedValue(account({ id: 'u2', pseudo: 'bob' }));

      await expect(pseudo.execute('u1', 'bob')).rejects.toThrow(ConflictException);
    });

    it('renames the account', async () => {
      const result = await pseudo.execute('u1', 'bob');

      expect(result.changed).toBe(true);
      expect((users.save.mock.calls[0]![0] as User).pseudo).toBe('bob');
    });
  });

  describe('UpdatePreferences', () => {
    it('leaves untouched what the request does not mention', async () => {
      users.findById.mockResolvedValue(account({ customInstructions: 'Sois concis' }));

      const saved = await preferences.execute('u1', { preferredModel: 'webgpu:x' });

      expect(saved.customInstructions).toBe('Sois concis');
      expect(saved.preferredModel).toBe('webgpu:x');
    });

    it('clears the instructions when given an empty string', async () => {
      users.findById.mockResolvedValue(account({ customInstructions: 'Sois concis' }));

      const saved = await preferences.execute('u1', { customInstructions: '   ' });

      expect(saved.customInstructions).toBeNull();
    });
  });

  describe('ChangePassword', () => {
    it('refuse si le mot de passe actuel est faux', async () => {
      hasher.matches.mockResolvedValue(false);

      await expect(password.execute('u1', 'faux', 'N0uveau@Mdp1')).rejects.toThrow(
        'Mot de passe actuel incorrect',
      );
      expect(users.save).not.toHaveBeenCalled();
    });

    it('refuse pour un compte Google sans mot de passe', async () => {
      users.findById.mockResolvedValue(account({ passwordHash: null, googleId: 'g-1' }));

      await expect(password.execute('u1', 'peu importe', 'N0uveau@Mdp1')).rejects.toThrow(
        'Mot de passe actuel incorrect',
      );
    });

    it('enregistre le nouveau mot de passe haché', async () => {
      hasher.matches.mockResolvedValue(true);
      hasher.hash.mockResolvedValue('nouveau-hash');

      await password.execute('u1', 'ancien', 'N0uveau@Mdp1');

      expect((users.save.mock.calls[0]![0] as User).passwordHash).toBe('nouveau-hash');
    });

    it('invalide une demande de réinitialisation en cours', async () => {
      const user = account();
      user.openReset('un-hash', new Date(Date.now() + 60_000));
      users.findById.mockResolvedValue(user);
      hasher.matches.mockResolvedValue(true);

      await password.execute('u1', 'ancien', 'N0uveau@Mdp1');

      expect(user.pendingReset).toBeNull();
    });
  });

  describe('ChangeEmail', () => {
    it('refuse sans le bon mot de passe', async () => {
      hasher.matches.mockResolvedValue(false);

      await expect(emailChange.execute('u1', 'neuf@example.com', 'faux')).rejects.toThrow(
        'Mot de passe incorrect',
      );
    });

    it('refuse un email déjà pris par quelqu’un d’autre', async () => {
      hasher.matches.mockResolvedValue(true);
      users.findByEmail.mockResolvedValue(account({ id: 'u2' }));

      await expect(emailChange.execute('u1', 'pris@example.com', 'bon')).rejects.toThrow(
        ConflictException,
      );
    });

    it('accepte de réenregistrer sa propre adresse', async () => {
      hasher.matches.mockResolvedValue(true);
      users.findByEmail.mockResolvedValue(account());

      await expect(emailChange.execute('u1', 'alice@example.com', 'bon')).resolves.toBeDefined();
    });

    it('normalise l’adresse enregistrée', async () => {
      hasher.matches.mockResolvedValue(true);
      users.findByEmail.mockResolvedValue(null);

      const saved = await emailChange.execute('u1', '  NEUF@Example.COM  ', 'bon');

      expect(saved.email).toBe('neuf@example.com');
    });
  });

  describe('DeleteAccount', () => {
    it('refuses to delete an account that does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(remove.execute('absent')).rejects.toThrow(NotFoundException);
      expect(users.remove).not.toHaveBeenCalled();
    });
  });

  describe('ListUsers', () => {
    it('passes the pagination through to the repository', async () => {
      users.list.mockResolvedValue(toPage<User>([], 0));

      await list.execute({ offset: 25, limit: 10 });

      expect(users.list).toHaveBeenCalledWith({ offset: 25, limit: 10 });
    });
  });

  describe('ChangeRole', () => {
    it('refuses to demote the last administrator', async () => {
      users.findById.mockResolvedValue(account({ role: UserRole.Admin }));
      users.countAdmins.mockResolvedValue(1);

      await expect(role.execute('u1', UserRole.User)).rejects.toThrow(BadRequestException);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('allows a demotion while another administrator remains', async () => {
      users.findById.mockResolvedValue(account({ role: UserRole.Admin }));
      users.countAdmins.mockResolvedValue(2);

      const saved = await role.execute('u1', UserRole.User);

      expect(saved.role).toBe(UserRole.User);
    });

    it('never counts administrators when promoting', async () => {
      await role.execute('u1', UserRole.Admin);

      expect(users.countAdmins).not.toHaveBeenCalled();
    });

    it('reports an unknown account', async () => {
      users.findById.mockResolvedValue(null);

      await expect(role.execute('absent', UserRole.Admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('SignInWithGoogle', () => {
    const profile = {
      googleId: 'g-1',
      email: 'alice@example.com',
      displayName: 'Alice Dupont',
    };

    it('reconnaît un compte Google déjà lié sans rien réécrire', async () => {
      users.findByGoogleId.mockResolvedValue(account({ googleId: 'g-1' }));

      await expect(google.execute(profile)).resolves.toMatchObject({ id: 'u1' });
      expect(users.save).not.toHaveBeenCalled();
    });

    it('lie Google à un compte existant portant le même email', async () => {
      users.findByEmail.mockResolvedValue(account());

      const linked = await google.execute(profile);

      expect(linked.googleId).toBe('g-1');
      expect(linked.id).toBe('u1');
    });

    it('conserve le mot de passe du compte lié, qui reste utilisable', async () => {
      users.findByEmail.mockResolvedValue(account());

      const linked = await google.execute(profile);

      expect(linked.passwordHash).toBe('hashed');
      expect(linked.signsInWithPassword).toBe(true);
    });

    it('crée un compte sans mot de passe quand l’email est inconnu', async () => {
      const created = await google.execute(profile);

      expect(created.passwordHash).toBeNull();
      expect(created.signsInWithPassword).toBe(false);
      expect(created.googleId).toBe('g-1');
    });

    it('reprend le nom Google comme pseudo', async () => {
      const created = await google.execute(profile);

      expect(created.pseudo).toBe('Alice_Dupont');
    });

    it('évite la collision quand ce pseudo est déjà pris', async () => {
      users.findByPseudo.mockImplementation((pseudo: string) =>
        Promise.resolve(pseudo === 'Alice_Dupont' ? account({ id: 'autre' }) : null),
      );

      const created = await google.execute(profile);

      expect(created.pseudo).toBe('Alice_Dupont_2');
    });

    it('retombe sur l’email quand Google ne donne aucun nom', async () => {
      const created = await google.execute({ ...profile, displayName: '' });

      expect(created.pseudo).toBe('alice');
    });
  });

  describe('VerifyCredentials', () => {
    it('returns nothing for an unknown email, without hashing anything', async () => {
      await expect(credentials.execute('absent@example.com', 'x')).resolves.toBeNull();
      expect(hasher.matches).not.toHaveBeenCalled();
    });

    it('refuse un compte Google qui n’a pas de mot de passe', async () => {
      users.findByEmail.mockResolvedValue(account({ passwordHash: null, googleId: 'g-1' }));

      await expect(credentials.execute('alice@example.com', 'peu importe')).resolves.toBeNull();
      expect(hasher.matches).not.toHaveBeenCalled();
    });

    it('returns nothing when the password does not match', async () => {
      users.findByEmail.mockResolvedValue(account());
      hasher.matches.mockResolvedValue(false);

      await expect(credentials.execute('alice@example.com', 'bad')).resolves.toBeNull();
    });

    it('returns the account when the password matches', async () => {
      users.findByEmail.mockResolvedValue(account());
      hasher.matches.mockResolvedValue(true);

      await expect(credentials.execute('alice@example.com', 'good')).resolves.toMatchObject({
        id: 'u1',
      });
    });
  });
});

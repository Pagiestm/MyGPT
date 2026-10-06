import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GetUser, VerifyCredentials } from '../../user/application/user.use-cases';
import { User } from '../../user/domain/user';
import { UserRole } from '../../user/domain/user-role.enum';
import { GetProfile, SignIn } from './auth.use-cases';

const account = () =>
  User.rehydrate({
    id: '1',
    email: 'test@example.com',
    pseudo: 'testuser',
    passwordHash: 'hashed',
    googleId: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    role: UserRole.User,
    customInstructions: 'Sois concis',
    preferredModel: null,
    createdAt: new Date(),
  });

describe('Auth use cases', () => {
  const credentials = { execute: jest.fn() };
  const getUser = { execute: jest.fn() };
  let signIn: SignIn;
  let profile: GetProfile;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SignIn,
        GetProfile,
        { provide: VerifyCredentials, useValue: credentials },
        { provide: GetUser, useValue: getUser },
      ],
    }).compile();
    signIn = module.get(SignIn);
    profile = module.get(GetProfile);
  });

  describe('SignIn', () => {
    it('returns the account when the password matches', async () => {
      credentials.execute.mockResolvedValue(account());

      await expect(signIn.execute('test@example.com', 'good')).resolves.toMatchObject({ id: '1' });
    });

    it('says nothing about which half of the credentials was wrong', async () => {
      credentials.execute.mockResolvedValue(null);

      await expect(signIn.execute('test@example.com', 'bad')).rejects.toThrow(
        'Identifiants invalides',
      );
      await expect(signIn.execute('absent@example.com', 'bad')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('GetProfile', () => {
    it('reads the account behind the session', async () => {
      getUser.execute.mockResolvedValue(account());

      await expect(profile.execute('1')).resolves.toMatchObject({ pseudo: 'testuser' });
      expect(getUser.execute).toHaveBeenCalledWith('1');
    });
  });
});

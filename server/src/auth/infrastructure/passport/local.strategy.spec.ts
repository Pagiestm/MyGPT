import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../../../user/domain/user';
import { UserRole } from '../../../user/domain/user-role.enum';
import { SignIn } from '../../application/auth.use-cases';
import { LocalStrategy } from './local.strategy';

const account = () =>
  User.rehydrate({
    id: '1',
    email: 'test@example.com',
    pseudo: 'testuser',
    passwordHash: 'hashed',
    role: UserRole.User,
    customInstructions: null,
    preferredModel: null,
    createdAt: new Date(),
  });

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  const signIn = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [LocalStrategy, { provide: SignIn, useValue: signIn }],
    }).compile();
    strategy = module.get(LocalStrategy);
  });

  it('keeps only what the session needs, never the password hash', async () => {
    signIn.execute.mockResolvedValue(account());

    const result = await strategy.validate('test@example.com', 'password123');

    expect(result).toEqual({
      id: '1',
      email: 'test@example.com',
      pseudo: 'testuser',
      role: UserRole.User,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(signIn.execute).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('lets a rejected sign-in surface as a 401', async () => {
    signIn.execute.mockRejectedValue(new UnauthorizedException('Identifiants invalides'));

    await expect(strategy.validate('test@example.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

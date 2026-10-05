import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data if validation succeeds', async () => {
      const validUser = {
        id: '1',
        email: 'test@example.com',
        pseudo: 'testuser',
      };
      mockAuthService.validateUser = jest.fn().mockResolvedValue(validUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(validUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should throw UnauthorizedException if user validation fails', async () => {
      mockAuthService.validateUser = jest.fn().mockResolvedValue(null);

      await expect(strategy.validate('test@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user format is invalid', async () => {
      mockAuthService.validateUser = jest.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      await expect(strategy.validate('test@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

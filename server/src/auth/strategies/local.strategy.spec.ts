import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    // Mock du AuthService
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
      // Arrange: un utilisateur valide
      const validUser = {
        id: '1',
        email: 'test@example.com',
        pseudo: 'testuser',
      };
      mockAuthService.validateUser = jest.fn().mockResolvedValue(validUser);

      // Act
      const result = await strategy.validate('test@example.com', 'password123');

      // Assert
      expect(result).toEqual(validUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException if user validation fails', async () => {
      // Arrange: aucun utilisateur trouvé
      mockAuthService.validateUser = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user format is invalid', async () => {
      // Arrange: utilisateur avec format invalide (pseudo manquant)
      mockAuthService.validateUser = jest.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        // pseudo manquant
      });

      // Act & Assert
      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

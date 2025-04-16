import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Session } from 'express-session';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: Partial<UserService>;

  // Données de test
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    pseudo: 'testuser',
    password: 'hashedPassword',
    created_at: new Date(),
  };

  beforeEach(async () => {
    mockUserService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    (bcrypt.compare as jest.Mock).mockImplementation((plainPass) =>
      Promise.resolve(plainPass === 'validPassword'),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return user if credentials are valid', async () => {
      // Arrange
      mockUserService.findByEmail = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = (await service.validateUser(
        'test@example.com',
        'validPassword',
      )) as { id: string; email: string; pseudo: string };

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        pseudo: mockUser.pseudo,
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'validPassword',
        mockUser.password,
      );
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      // Arrange
      mockUserService.findByEmail = jest
        .fn()
        .mockRejectedValue(new UnauthorizedException());

      // Act & Assert
      await expect(
        service.validateUser('wrong@example.com', 'anyPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      mockUserService.findByEmail = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.validateUser('test@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return successful login message', () => {
      const result = service.login();
      expect(result).toEqual({ message: 'Connexion réussie' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile data', async () => {
      // Arrange
      mockUserService.findOne = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = (await service.getProfile('1')) as {
        pseudo: string;
        email: string;
      };

      // Assert
      expect(result).toEqual({
        pseudo: mockUser.pseudo,
        email: mockUser.email,
      });
      expect(mockUserService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('logout', () => {
    it('should destroy session and clear cookie', () => {
      // Arrange
      const mockDestroy = jest.fn((cb?: (err: any) => void) => {
        if (cb && typeof cb === 'function') {
          cb(null);
        }
        return undefined;
      });

      const mockClearCookie = jest.fn();

      const mockSession = {
        destroy: mockDestroy,
      } as unknown as Session;

      const mockResponse = {
        clearCookie: mockClearCookie,
      } as unknown as Response;

      // Act
      const result = service.logout(mockSession, mockResponse);

      // Assert
      expect(result).toEqual({ message: 'Déconnexion réussie' });
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockClearCookie).toHaveBeenCalled();
    });
  });
});

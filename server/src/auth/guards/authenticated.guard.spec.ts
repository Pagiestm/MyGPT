import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedGuard } from './authenticated.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticatedGuard],
    }).compile();

    guard = module.get<AuthenticatedGuard>(AuthenticatedGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if user is authenticated', () => {
      // Arrange: utilisateur authentifié
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            isAuthenticated: () => true,
            user: { id: '1', email: 'test@example.com', pseudo: 'testuser' },
          }),
        }),
      } as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user is not authenticated', () => {
      // Arrange: utilisateur non authentifié
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            isAuthenticated: () => false,
          }),
        }),
      } as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if isAuthenticated is not a function', () => {
      // Arrange: méthode isAuthenticated manquante
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            // isAuthenticated n'existe pas
          }),
        }),
      } as ExecutionContext;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});

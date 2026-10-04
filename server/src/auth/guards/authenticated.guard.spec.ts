import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedGuard } from './authenticated.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

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
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            isAuthenticated: () => true,
            user: { id: '1', email: 'test@example.com', pseudo: 'testuser' },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            isAuthenticated: () => false,
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Vous devez être connecté pour accéder à cette ressource',
      );
    });

    it('should throw UnauthorizedException if isAuthenticated is not a function', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            // isAuthenticated n'existe pas
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Session non valide');
    });
  });
});

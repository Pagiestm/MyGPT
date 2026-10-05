import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../user/user-role.enum';

const contextFor = (user?: { id: string; role?: UserRole }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = { getAllAndOverride: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    const module = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();
    guard = module.get(RolesGuard);
  });

  it('lets any signed-in user through a route without @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextFor({ id: 'u1' }))).toBe(true);
  });

  it('admits a user holding the required role', () => {
    expect(guard.canActivate(contextFor({ id: 'u1', role: UserRole.Admin }))).toBe(true);
  });

  it('refuses a user without it', () => {
    expect(() => guard.canActivate(contextFor({ id: 'u1', role: UserRole.User }))).toThrow(
      ForbiddenException,
    );
  });

  it('refuses a request without a user', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('reads both the handler and the class, so a controller-wide @Roles applies', () => {
    guard.canActivate(contextFor({ id: 'u1', role: UserRole.Admin }));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [undefined, undefined]);
  });
});

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OriginGuard } from './origin.guard';

const contextFor = (method: string, origin?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method, get: () => origin }),
    }),
  }) as unknown as ExecutionContext;

describe('OriginGuard', () => {
  beforeEach(() => {
    process.env.CLIENT_URL = 'https://app.exemple.fr';
  });

  it('admits a request from the configured origin', () => {
    expect(new OriginGuard().canActivate(contextFor('POST', 'https://app.exemple.fr'))).toBe(true);
  });

  it('refuses a request from anywhere else', () => {
    expect(() => new OriginGuard().canActivate(contextFor('POST', 'https://pirate.fr'))).toThrow(
      ForbiddenException,
    );
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('never blocks %s', (method) => {
    expect(new OriginGuard().canActivate(contextFor(method, 'https://pirate.fr'))).toBe(true);
  });

  it('admits a request without an Origin header, as curl or a native client sends', () => {
    expect(new OriginGuard().canActivate(contextFor('POST', undefined))).toBe(true);
  });

  it('accepts several origins separated by commas', () => {
    process.env.CLIENT_URL = 'https://app.exemple.fr, https://admin.exemple.fr';
    const guard = new OriginGuard();

    expect(guard.canActivate(contextFor('POST', 'https://admin.exemple.fr'))).toBe(true);
  });
});

import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { CSRF_COOKIE, LEGACY_CSRF_PATHS } from './csrf';
import { CsrfController } from './csrf.controller';

jest.mock('./csrf', () => ({
  ...jest.requireActual<typeof import('./csrf')>('./csrf'),
  generateCsrfToken: jest.fn(() => 'un-jeton'),
}));

describe('CsrfController', () => {
  let controller: CsrfController;

  const request = (cookies: Record<string, string> = {}) =>
    ({ cookies, session: {} }) as unknown as Request;
  const response = () => ({ clearCookie: jest.fn() }) as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({ controllers: [CsrfController] }).compile();
    controller = module.get(CsrfController);
  });

  it('issues a token', () => {
    expect(controller.token(request(), response())).toEqual({ token: 'un-jeton' });
  });

  it('pins the session so the token stays bound to a stable identifier', () => {
    const req = request();

    controller.token(req, response());

    expect(req.session.csrfIssuedAt).toEqual(expect.any(Number));
  });

  it('clears a cookie left on another path, which would otherwise shadow the new one', () => {
    const res = response();

    controller.token(request({ [CSRF_COOKIE]: 'herite' }), res);

    for (const path of LEGACY_CSRF_PATHS) {
      expect(res.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE, { path });
    }
  });

  it('clears nothing when the browser carries no such cookie', () => {
    const res = response();

    controller.token(request(), res);

    expect(res.clearCookie).not.toHaveBeenCalled();
  });
});

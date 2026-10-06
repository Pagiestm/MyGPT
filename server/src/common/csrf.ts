import { doubleCsrf } from 'csrf-csrf';
import type { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const CSRF_HEADER = 'x-csrf-token';

export const CSRF_COOKIE = isProduction ? '__Host-mygpt.csrf' : 'mygpt.csrf';

export const LEGACY_CSRF_PATHS = ['/auth', '/users', '/csrf'];

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET ?? 'secret-de-developpement-uniquement-32c',
  getSessionIdentifier: (req: Request) => req.sessionID ?? '',
  cookieName: CSRF_COOKIE,
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  },
  getCsrfTokenFromRequest: (req: Request) => req.get(CSRF_HEADER),
});

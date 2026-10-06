import { Throttle } from '@nestjs/throttler';

export const AUTH_THROTTLER = 'auth';
export const AUTH_WINDOW_MS = 900_000;
export const AUTH_ATTEMPTS = 10;

export const ThrottleAuth = () =>
  Throttle({ [AUTH_THROTTLER]: { ttl: AUTH_WINDOW_MS, limit: AUTH_ATTEMPTS } });

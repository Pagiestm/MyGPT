import type { ThrottlerOptions } from '@nestjs/throttler';
import { AUTH_THROTTLER, AUTH_WINDOW_MS } from './common/decorators/throttle-auth.decorator';

export const throttlers: ThrottlerOptions[] = [
  { name: 'short', ttl: 1000, limit: 30 },
  { name: 'medium', ttl: 60_000, limit: 300 },
  { name: AUTH_THROTTLER, ttl: AUTH_WINDOW_MS, limit: Number.MAX_SAFE_INTEGER },
];

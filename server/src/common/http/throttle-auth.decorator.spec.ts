import {
  AUTH_ATTEMPTS,
  AUTH_WINDOW_MS,
  AUTH_THROTTLER,
  ThrottleAuth,
} from './throttle-auth.decorator';
import { throttlers } from '../../app.throttlers';

class Cible {
  @ThrottleAuth()
  connexion() {}
}

const metadata = (key: string) =>
  Reflect.getMetadata(`${key}${AUTH_THROTTLER}`, Cible.prototype.connexion) as unknown;

describe('ThrottleAuth', () => {
  it('applique la limite de tentatives attendue', () => {
    expect(metadata('THROTTLER:LIMIT')).toBe(AUTH_ATTEMPTS);
  });

  it('applique la fenêtre de temps attendue', () => {
    expect(metadata('THROTTLER:TTL')).toBe(AUTH_WINDOW_MS);
  });

  it('vise un limiteur réellement déclaré à la racine', () => {
    expect(throttlers.map((t) => t.name)).toContain(AUTH_THROTTLER);
  });

  it('partage la fenêtre avec la déclaration racine', () => {
    const declared = throttlers.find((t) => t.name === AUTH_THROTTLER);

    expect(declared?.ttl).toBe(AUTH_WINDOW_MS);
  });

  it('resserre bien la limite permissive de la racine', () => {
    const declared = throttlers.find((t) => t.name === AUTH_THROTTLER);

    expect(AUTH_ATTEMPTS).toBeLessThan(Number(declared?.limit));
  });
});

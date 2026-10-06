import { googleOauthConfig } from './google.config';

describe('googleOauthConfig', () => {
  const previous = { ...process.env };

  beforeEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK_URL;
  });

  afterEach(() => {
    process.env = { ...previous };
  });

  it('considers Google unavailable when nothing is configured', () => {
    expect(googleOauthConfig()).toBeNull();
  });

  it('refuses a half-filled configuration rather than failing later', () => {
    process.env.GOOGLE_CLIENT_ID = 'un-identifiant';

    expect(googleOauthConfig()).toBeNull();
  });

  it('falls back to the local callback when none is given', () => {
    process.env.GOOGLE_CLIENT_ID = 'un-identifiant';
    process.env.GOOGLE_CLIENT_SECRET = 'un-secret';

    expect(googleOauthConfig()).toEqual({
      clientID: 'un-identifiant',
      clientSecret: 'un-secret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
    });
  });

  it('honours the callback declared for the deployment', () => {
    process.env.GOOGLE_CLIENT_ID = 'un-identifiant';
    process.env.GOOGLE_CLIENT_SECRET = 'un-secret';
    process.env.GOOGLE_CALLBACK_URL = 'https://api.exemple.fr/auth/google/callback';

    expect(googleOauthConfig()?.callbackURL).toBe('https://api.exemple.fr/auth/google/callback');
  });
});

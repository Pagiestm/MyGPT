export interface GoogleOauthConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

export function googleOauthConfig(): GoogleOauthConfig | null {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) return null;

  return {
    clientID,
    clientSecret,
    callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
  };
}

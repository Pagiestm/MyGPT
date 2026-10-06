import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { SignInWithGoogle } from '../../../user/application/user.use-cases';
import { googleOauthConfig } from '../../google.config';
import type { SessionUser } from './session.serializer';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly signIn: SignInWithGoogle) {
    super({ ...googleOauthConfig(), scope: ['email', 'profile'] });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Ce compte Google ne publie aucune adresse email'));
      return;
    }

    try {
      const user = await this.signIn.execute({
        googleId: profile.id,
        email: email.toLowerCase(),
        displayName: profile.displayName ?? '',
      });
      const session: SessionUser = {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
        role: user.role,
      };
      done(null, session);
    } catch (error) {
      done(error as Error);
    }
  }
}

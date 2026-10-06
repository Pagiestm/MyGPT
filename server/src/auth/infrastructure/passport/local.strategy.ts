import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { SignIn } from '../../application/auth.use-cases';
import type { SessionUser } from './session.serializer';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly signIn: SignIn) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<SessionUser> {
    const user = await this.signIn.execute(email, password);
    return { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role };
  }
}

import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { googleOauthConfig } from '../../../google.config';
import { openSession } from './open-session';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (!googleOauthConfig()) {
      throw new NotFoundException('Cette instance ne propose pas la connexion avec Google');
    }
    return super.canActivate(context);
  }
}

@Injectable()
export class GoogleCallbackGuard extends GoogleAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = (await super.canActivate(context)) as boolean;
    await openSession(context);
    return allowed;
  }
}

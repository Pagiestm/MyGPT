import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  isAuthenticated(): this is AuthenticatedRequest;
  user: Express.User;
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (typeof request.isAuthenticated !== 'function') {
      throw new UnauthorizedException('Session non valide');
    }

    if (!request.isAuthenticated()) {
      throw new UnauthorizedException(
        'Vous devez être connecté pour accéder à cette ressource',
      );
    }

    return true;
  }
}

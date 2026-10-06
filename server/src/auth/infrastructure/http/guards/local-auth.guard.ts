import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface RequestWithLogin extends Request {
  user: any;
  logIn: (user: any, callback?: (err?: Error) => void) => void;
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest<RequestWithLogin>();

    try {
      await new Promise<void>((resolve, reject) => {
        request.logIn(request.user, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la connexion à la session:', error);
      return false;
    }

    return result;
  }
}

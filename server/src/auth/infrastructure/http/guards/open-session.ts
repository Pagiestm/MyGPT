import type { ExecutionContext } from '@nestjs/common';

interface RequestWithLogin {
  user: unknown;
  logIn: (user: unknown, callback: (err?: Error) => void) => void;
}

export function openSession(context: ExecutionContext): Promise<void> {
  const request = context.switchToHttp().getRequest<RequestWithLogin>();

  return new Promise<void>((resolve, reject) => {
    request.logIn(request.user, (err) => (err ? reject(err) : resolve()));
  });
}

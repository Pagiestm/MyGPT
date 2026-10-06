import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GetUser, VerifyCredentials } from '../../user/application/user.use-cases';
import type { User } from '../../user/domain/user';

@Injectable()
export class SignIn {
  constructor(private readonly credentials: VerifyCredentials) {}

  async execute(email: string, password: string): Promise<User> {
    const user = await this.credentials.execute(email, password);
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    return user;
  }
}

@Injectable()
export class GetProfile {
  constructor(private readonly get: GetUser) {}

  execute(userId: string): Promise<User> {
    return this.get.execute(userId);
  }
}

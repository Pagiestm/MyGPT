import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserOrm } from '../user/infrastructure/persistence/user.orm-entity';
import { GetProfile, SignIn } from './application/auth.use-cases';
import { googleOauthConfig } from './google.config';
import { LocalStrategy } from './infrastructure/passport/local.strategy';
import { GoogleStrategy } from './infrastructure/passport/google.strategy';
import { SessionSerializer } from './infrastructure/passport/session.serializer';
import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([UserOrm]),
    PassportModule.register({ session: true }),
  ],
  providers: [
    SignIn,
    GetProfile,
    LocalStrategy,
    SessionSerializer,
    ...(googleOauthConfig() ? [GoogleStrategy] : []),
  ],
  controllers: [AuthController],
})
export class AuthModule {}

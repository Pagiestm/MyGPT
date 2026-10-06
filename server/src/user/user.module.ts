import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { USER_REPOSITORY } from './domain/user.repository';
import { MAILER } from '../common/mail/mailer';
import { SmtpMailer } from '../common/mail/smtp.mailer';
import { RequestPasswordReset, ResetPassword } from './application/password-reset.use-cases';
import {
  ChangeEmail,
  ChangePassword,
  ChangePseudo,
  ChangeRole,
  DeleteAccount,
  GetUser,
  GetUserByEmail,
  ListUsers,
  RegisterUser,
  SignInWithGoogle,
  UpdatePreferences,
  VerifyCredentials,
} from './application/user.use-cases';
import { UserOrm } from './infrastructure/persistence/user.orm-entity';
import { TypeormUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { UserController } from './infrastructure/http/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrm])],
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeormUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: MAILER, useClass: SmtpMailer },
    ChangePassword,
    ChangeEmail,
    RequestPasswordReset,
    ResetPassword,
    GetUser,
    GetUserByEmail,
    RegisterUser,
    ChangePseudo,
    UpdatePreferences,
    DeleteAccount,
    ListUsers,
    ChangeRole,
    VerifyCredentials,
    SignInWithGoogle,
  ],
  exports: [GetUser, GetUserByEmail, VerifyCredentials, SignInWithGoogle],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { USER_REPOSITORY } from './domain/user.repository';
import {
  ChangePseudo,
  ChangeRole,
  DeleteAccount,
  GetUser,
  GetUserByEmail,
  ListUsers,
  RegisterUser,
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
    GetUser,
    GetUserByEmail,
    RegisterUser,
    ChangePseudo,
    UpdatePreferences,
    DeleteAccount,
    ListUsers,
    ChangeRole,
    VerifyCredentials,
  ],
  exports: [GetUser, GetUserByEmail, VerifyCredentials],
})
export class UserModule {}

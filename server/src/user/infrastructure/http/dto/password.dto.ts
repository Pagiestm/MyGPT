import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

const STRONG = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

const STRENGTH_MESSAGE =
  'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  currentPassword: string;

  @ApiProperty({ description: 'Nouveau mot de passe', example: 'P@ssw0rd123' })
  @IsString()
  @Length(10, 50, { message: 'Le mot de passe doit contenir au minimum 10 caractères' })
  @Matches(STRONG, { message: STRENGTH_MESSAGE })
  newPassword: string;
}

export class ChangeEmailDto {
  @ApiProperty({ description: 'Nouvel email', example: 'nouvelle@adresse.fr' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ description: 'Mot de passe actuel, pour confirmer' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Jeton reçu par courriel' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Nouveau mot de passe', example: 'P@ssw0rd123' })
  @IsString()
  @Length(10, 50, { message: 'Le mot de passe doit contenir au minimum 10 caractères' })
  @Matches(STRONG, { message: STRENGTH_MESSAGE })
  password: string;
}

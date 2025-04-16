import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "Email de connexion de l'utilisateur",
    example: 'alice@example.com',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'P@ssw0rd123',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @Length(10, 50, {
    message: 'Le mot de passe doit contenir au minimum 10 caractères',
  })
  @Matches(
    /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    {
      message:
        'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial',
    },
  )
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}

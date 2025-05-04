import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdatePseudoDto {
  @ApiProperty({
    description: "Nouveau pseudo de l'utilisateur",
    example: 'nouveau_pseudo42',
  })
  @IsString({ message: 'Le pseudo doit être une chaîne de caractères' })
  @Length(3, 20, {
    message: 'Le pseudo doit contenir entre 3 et 20 caractères',
  })
  @IsNotEmpty({ message: 'Le pseudo est requis' })
  pseudo: string;
}

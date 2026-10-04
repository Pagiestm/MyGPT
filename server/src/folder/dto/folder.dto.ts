import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: 'Nom du dossier', example: 'Cours de JavaScript' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du dossier est requis' })
  @MaxLength(60, { message: 'Le nom du dossier ne peut pas dépasser 60 caractères' })
  name: string;

  @ApiProperty({
    description: "Consignes communes envoyées à l'IA pour les conversations du dossier",
    example: 'Explique comme à un étudiant de première année.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Les consignes ne peuvent pas dépasser 2000 caractères' })
  instructions?: string;
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) {}

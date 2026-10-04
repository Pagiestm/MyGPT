import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsOptional, ValidateIf } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Titre de la conversation',
    example: 'Discussion sur NestJS',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'ID utilisateur (ajouté automatiquement par le serveur)',
    readOnly: true,
  })
  userId?: string;

  @ApiProperty({
    description: 'Indique si la conversation est publique',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Dossier dans lequel ranger la conversation (null pour la sortir du dossier)',
    example: 'f1e2d3c4-1234-4abc-bdef-ff123456789a',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  @IsOptional()
  folderId?: string | null;
}

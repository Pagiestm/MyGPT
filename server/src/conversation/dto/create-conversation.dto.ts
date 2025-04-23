import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';

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
}

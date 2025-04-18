import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({
    description: "ID de l'utilisateur propriétaire",
    example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Indique si la conversation est publique',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

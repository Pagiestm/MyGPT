import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RegenerateDto {
  @ApiProperty({
    description: "Modèle d'IA à utiliser",
    example: 'gemini-3.8-flash',
    required: false,
  })
  @IsString()
  @IsOptional()
  model?: string;
}

export class EditMessageDto extends RegenerateDto {
  @ApiProperty({ description: 'Nouveau contenu de la question', example: 'Et en Python ?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content: string;
}

export class SendMessageDto extends EditMessageDto {
  @ApiProperty({
    description: 'Conversation concernée',
    example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Fichiers déjà envoyés via POST /attachments',
    type: [String],
    required: false,
  })
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('all', { each: true })
  @IsOptional()
  attachmentIds?: string[];
}

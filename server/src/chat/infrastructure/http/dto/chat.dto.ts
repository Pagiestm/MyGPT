import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EMBEDDING_DIMENSIONS } from '../../../../knowledge/domain/knowledge-document';

export class RegenerateDto {
  @ApiProperty({
    description: "Modèle d'IA à utiliser",
    example: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    required: false,
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({
    description:
      'Vecteur de la question, calculé par le navigateur, pour la recherche documentaire. ' +
      'Absent si la base de connaissances est vide.',
    type: [Number],
    required: false,
  })
  @IsArray()
  @ArrayMinSize(EMBEDDING_DIMENSIONS)
  @ArrayMaxSize(EMBEDDING_DIMENSIONS)
  @IsNumber({}, { each: true })
  @IsOptional()
  questionEmbedding?: number[];
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

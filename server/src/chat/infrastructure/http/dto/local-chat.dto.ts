import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { BROWSER_MODEL_PREFIX } from '../../../domain/prompt';

export class SaveReplyDto {
  @ApiProperty({ description: 'Conversation concernée' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Réponse produite côté navigateur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  content: string;

  @ApiProperty({
    description: 'Modèle ayant produit la réponse, côté navigateur',
    example: `${BROWSER_MODEL_PREFIX}Llama-3.2-3B-Instruct-q4f16_1-MLC`,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  model: string;
}

export class SaveTitleDto {
  @ApiProperty({ description: 'Conversation à renommer' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Titre produit côté navigateur',
    example: 'Déployer avec Docker',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;
}

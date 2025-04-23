import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SaveSharedConversationDto {
  @ApiProperty({
    description: 'ID de la conversation partagée à sauvegarder',
    example: '5e9f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f',
  })
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'Lien de partage de la conversation',
    example: '5e3e336661b57d3c',
  })
  @IsNotEmpty()
  @IsString()
  shareLink: string;

  @ApiProperty({
    description: 'Nouveau nom pour la conversation sauvegardée (optionnel)',
    example: 'Ma copie de la conversation sur les IA',
    required: false,
  })
  @IsOptional()
  @IsString()
  newName?: string;
}

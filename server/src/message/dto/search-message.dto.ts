import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class SearchMessagesDto {
  @ApiProperty({
    description: 'Mot-clé pour rechercher dans les messages',
    example: 'NestJS',
  })
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @ApiProperty({
    description: 'ID de la conversation où chercher',
    example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a',
  })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;
}

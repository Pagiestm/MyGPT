import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenu du message',
    example:
      'Comment puis-je implémenter une architecture hexagonale en NestJS?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID de la conversation associée',
    example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a',
  })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: "Indique si le message provient de l'IA",
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFromAi?: boolean = false;
}

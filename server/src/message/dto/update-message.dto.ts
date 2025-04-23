import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @ApiProperty({
    description: 'Nouveau contenu du message',
    example:
      'Comment implémenter une architecture hexagonale en NestJS avec des adaptateurs?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationDto } from './create-conversation.dto';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
  @ApiProperty({
    description: 'Nouveau titre de la conversation',
    example: 'Discussion avancée sur NestJS',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Nouvelle visibilité publique de la conversation',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

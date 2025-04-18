import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ShareConversationDto {
  @ApiProperty({
    description: "Date d'expiration du lien (optionnel)",
    example: '2025-05-17T16:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

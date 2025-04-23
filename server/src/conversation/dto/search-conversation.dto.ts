import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SearchConversationDto {
  @ApiProperty({
    description: 'Mot-clé de recherche',
    example: 'NestJS',
    required: true,
  })
  @IsString()
  keyword: string;

  @ApiProperty({
    description: "ID de l'utilisateur pour limiter la recherche (optionnel)",
    example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

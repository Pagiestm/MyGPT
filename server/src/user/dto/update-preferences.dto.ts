import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: "Consignes envoyées à l'IA avant chaque échange (vide pour les retirer)",
    example: 'Réponds de façon concise, avec des exemples en TypeScript.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Les consignes ne peuvent pas dépasser 2000 caractères' })
  customInstructions?: string;

  @ApiPropertyOptional({
    description: 'Modèle utilisé par défaut (null pour revenir au modèle par défaut)',
    example: 'gemini-3.8-flash',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsOptional()
  preferredModel?: string | null;
}

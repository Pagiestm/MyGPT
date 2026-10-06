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
    example: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsOptional()
  preferredModel?: string | null;
}

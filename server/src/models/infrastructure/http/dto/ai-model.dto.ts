import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BROWSER_MODEL_PREFIX } from '../../../../chat/domain/prompt';

export class CreateAiModelDto {
  @ApiProperty({
    description: 'Identifiant MLC, préfixé « webgpu: »',
    example: `${BROWSER_MODEL_PREFIX}Llama-3.2-3B-Instruct-q4f16_1-MLC`,
  })
  @IsString()
  @MaxLength(200)
  @Matches(new RegExp(`^${BROWSER_MODEL_PREFIX}[A-Za-z0-9._-]+$`), {
    message: 'Identifiant attendu sous la forme « webgpu:<modèle MLC> »',
  })
  id: string;

  @ApiProperty({ example: 'Llama 3.2 3B' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label: string;

  @ApiProperty({ example: 'Bon compromis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  description: string;

  @ApiProperty({ description: 'Mémoire graphique nécessaire, en mégaoctets', example: 2264 })
  @IsInt()
  @Min(1)
  @Max(64_000)
  vramMb: number;

  @ApiProperty({ required: false, description: 'Ordre dans le sélecteur' })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateAiModelDto extends PartialType(CreateAiModelDto) {
  @ApiProperty({
    required: false,
    description: 'Passer à `true` incrémente la révision et force le retéléchargement des poids',
  })
  @IsBoolean()
  @IsOptional()
  refreshWeights?: boolean;
}

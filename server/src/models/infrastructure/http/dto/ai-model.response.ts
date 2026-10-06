import { ApiProperty } from '@nestjs/swagger';
import type { AiModel } from '../../../domain/ai-model';

export class AiModelResponse {
  @ApiProperty({
    description: 'Identifiant MLC du modèle, préfixé « webgpu: »',
    example: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
  })
  id: string;

  @ApiProperty({ description: 'Nom affiché', example: 'Llama 3.2 3B' })
  label: string;

  @ApiProperty({ description: 'Ce à quoi il sert', example: 'Bon compromis' })
  description: string;

  @ApiProperty({ description: 'Mémoire graphique nécessaire, en mégaoctets', example: 2264 })
  vramMb: number;

  @ApiProperty({ description: 'Ordre dans le sélecteur, du plus léger au plus lourd' })
  position: number;

  @ApiProperty({ description: 'Un modèle désactivé reste en base mais disparaît du sélecteur' })
  enabled: boolean;

  @ApiProperty({
    description:
      "Révision des poids. L'incrémenter vide le cache du navigateur de chaque utilisateur, " +
      'qui retélécharge le modèle à sa prochaine utilisation, sans rien avoir à faire.',
    example: 1,
  })
  revision: number;

  @ApiProperty({ required: false, nullable: true, example: '3 milliards' })
  parameters: string | null;

  @ApiProperty({ type: [String], example: ['Suit bien les consignes'] })
  strengths: string[];

  @ApiProperty({ type: [String], example: ['Moins précis que les modèles plus gros'] })
  limitations: string[];

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Fenêtre de contexte annoncée par WebLLM, en jetons',
    example: 4096,
  })
  contextWindow: number | null;

  @ApiProperty({ description: 'Tient sur un GPU modeste, d’après WebLLM' })
  lowResource: boolean;

  @ApiProperty({ type: [String], example: ['shader-f16'] })
  requiredFeatures: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(model: AiModel): AiModelResponse {
    return {
      id: model.id,
      label: model.label,
      description: model.description,
      vramMb: model.vramMb,
      position: model.position,
      enabled: model.enabled,
      revision: model.revision,
      parameters: model.parameters,
      strengths: model.strengths,
      limitations: model.limitations,
      contextWindow: model.contextWindow,
      lowResource: model.lowResource,
      requiredFeatures: model.requiredFeatures,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

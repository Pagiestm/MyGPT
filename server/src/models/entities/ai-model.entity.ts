import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ai_models')
export class AiModel {
  @ApiProperty({
    description: 'Identifiant MLC du modèle, préfixé « webgpu: »',
    example: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
  })
  @PrimaryColumn()
  id: string;

  @ApiProperty({ description: 'Nom affiché', example: 'Llama 3.2 3B' })
  @Column()
  label: string;

  @ApiProperty({ description: 'Ce à quoi il sert', example: 'Bon compromis' })
  @Column()
  description: string;

  @ApiProperty({ description: 'Mémoire graphique nécessaire, en mégaoctets', example: 2264 })
  @Column('int')
  vramMb: number;

  @ApiProperty({ description: 'Ordre dans le sélecteur, du plus léger au plus lourd' })
  @Column('int', { default: 0 })
  position: number;

  @ApiProperty({ description: 'Un modèle désactivé reste en base mais disparaît du sélecteur' })
  @Column({ default: true })
  enabled: boolean;

  @ApiProperty({
    description:
      "Révision des poids. L'incrémenter vide le cache du navigateur de chaque utilisateur, " +
      'qui retélécharge le modèle à sa prochaine utilisation, sans rien avoir à faire.',
    example: 1,
  })
  @Column('int', { default: 1 })
  revision: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_models')
export class AiModelOrm {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;

  @Column()
  description: string;

  @Column('int')
  vramMb: number;

  @Column('int', { default: 0 })
  position: number;

  @Column({ default: true })
  enabled: boolean;

  @Column('int', { default: 1 })
  revision: number;

  @Column({ type: 'varchar', nullable: true })
  parameters: string | null;

  @Column('text', { array: true, default: () => "'{}'" })
  strengths: string[];

  @Column('text', { array: true, default: () => "'{}'" })
  limitations: string[];

  @Column('int', { nullable: true })
  contextWindow: number | null;

  @Column({ default: false })
  lowResource: boolean;

  @Column('text', { array: true, default: () => "'{}'" })
  requiredFeatures: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

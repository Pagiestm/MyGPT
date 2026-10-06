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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Folder } from '../../folder/entities/folder.entity';
import { KnowledgeChunk } from './knowledge-chunk.entity';

@Entity('knowledge_documents')
export class KnowledgeDocument {
  @ApiProperty({ example: 'd1e2f3a4-1234-4abc-bdef-ff123456789a' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nom du fichier', example: 'procedure-interne.md' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Type MIME', example: 'text/plain' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets', example: 18234 })
  @Column('int')
  size: number;

  @ApiProperty({ description: 'Nombre de fragments indexés', example: 12 })
  @Column('int', { default: 0 })
  chunkCount: number;

  @ApiProperty({
    description: "Modèle d'embedding utilisé : seuls les fragments du modèle courant sont comparés",
    example: 'text-embedding-004',
  })
  @Column()
  embeddingModel: string;

  @ApiProperty()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description:
      'Dossier auquel le document est réservé ; sans dossier, il vaut pour tout le compte',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  folderId: string | null;

  @ManyToOne(() => Folder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: Folder | null;

  @OneToMany(() => KnowledgeChunk, (chunk) => chunk.document)
  chunks: KnowledgeChunk[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}

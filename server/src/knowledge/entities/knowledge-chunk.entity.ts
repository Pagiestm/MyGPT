import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { EMBEDDING_DIMENSIONS } from '../../chat/prompt';
import { KnowledgeDocument } from './knowledge-document.entity';

@Entity('knowledge_chunks')
@Index(['documentId', 'position'])
export class KnowledgeChunk {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('uuid')
  documentId: string;

  @ManyToOne(() => KnowledgeDocument, (document) => document.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: KnowledgeDocument;

  @ApiProperty({ description: 'Rang du fragment dans le document' })
  @Column('int')
  position: number;

  @ApiProperty({ description: 'Texte du fragment' })
  @Column('text')
  content: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'vector', length: EMBEDDING_DIMENSIONS, select: false })
  embedding: number[];
}

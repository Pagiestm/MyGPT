import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EMBEDDING_DIMENSIONS } from '../../domain/knowledge-document';
import { KnowledgeDocumentOrm } from './knowledge-document.orm-entity';

@Entity('knowledge_chunks')
@Index(['documentId', 'position'])
export class KnowledgeChunkOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  documentId: string;

  @ManyToOne(() => KnowledgeDocumentOrm, (document) => document.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: KnowledgeDocumentOrm;

  @Column('int')
  position: number;

  @Column('text')
  content: string;

  @Column({ type: 'vector', length: EMBEDDING_DIMENSIONS, select: false })
  embedding: number[];
}

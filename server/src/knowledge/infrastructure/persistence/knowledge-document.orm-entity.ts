import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrm } from '../../../user/infrastructure/persistence/user.orm-entity';
import { FolderOrm } from '../../../folder/infrastructure/persistence/folder.orm-entity';
import { KnowledgeChunkOrm } from './knowledge-chunk.orm-entity';

@Entity('knowledge_documents')
export class KnowledgeDocumentOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  @Column('int', { default: 0 })
  chunkCount: number;

  @Column()
  embeddingModel: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrm;

  @Column({ type: 'uuid', nullable: true })
  folderId: string | null;

  @ManyToOne(() => FolderOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: FolderOrm | null;

  @OneToMany(() => KnowledgeChunkOrm, (chunk) => chunk.document)
  chunks: KnowledgeChunkOrm[];

  @CreateDateColumn()
  createdAt: Date;
}

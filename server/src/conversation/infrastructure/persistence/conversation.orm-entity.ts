import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrm } from '../../../user/infrastructure/persistence/user.orm-entity';
import { MessageOrm } from '../../../message/infrastructure/persistence/message.orm-entity';
import { FolderOrm } from '../../../folder/infrastructure/persistence/folder.orm-entity';

@Entity('conversations')
export class ConversationOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  sharedFrom: string | null;

  @ManyToOne(() => UserOrm, (user) => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrm;

  @OneToMany(() => MessageOrm, (message) => message.conversation)
  messages: MessageOrm[];

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  shareLink: string | null;

  @Column({ type: 'timestamp', nullable: true })
  shareExpiresAt: Date | null;

  @Column({ default: false })
  pinned: boolean;

  @Column({ default: false })
  archived: boolean;

  @Column({ default: false })
  titleLocked: boolean;

  @Column({ type: 'uuid', nullable: true })
  folderId: string | null;

  @ManyToOne(() => FolderOrm, (folder) => folder.conversations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folderId' })
  folder: FolderOrm | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

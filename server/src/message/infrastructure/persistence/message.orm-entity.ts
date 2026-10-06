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
import { ConversationOrm } from '../../../conversation/infrastructure/persistence/conversation.orm-entity';
import { AttachmentOrm } from '../../../attachment/infrastructure/persistence/attachment.orm-entity';

@Entity('messages')
export class MessageOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @ManyToOne(() => ConversationOrm, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationOrm;

  @Column('text')
  content: string;

  @Column({ default: false })
  isFromAi: boolean;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @OneToMany(() => AttachmentOrm, (attachment) => attachment.message)
  attachments: AttachmentOrm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageOrm } from '../../../message/infrastructure/persistence/message.orm-entity';
import { UserOrm } from '../../../user/infrastructure/persistence/user.orm-entity';

@Entity('attachments')
export class AttachmentOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  @Column({ type: 'bytea', select: false })
  data: Buffer;

  @Column()
  userId: string;

  @ManyToOne(() => UserOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrm;

  @Column({ type: 'uuid', nullable: true })
  messageId: string | null;

  @ManyToOne(() => MessageOrm, (message) => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: MessageOrm | null;

  @CreateDateColumn()
  createdAt: Date;
}

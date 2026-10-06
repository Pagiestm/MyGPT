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
import { ConversationOrm } from '../../../conversation/infrastructure/persistence/conversation.orm-entity';

@Entity('folders')
export class FolderOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column()
  userId: string;

  @ManyToOne(() => UserOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrm;

  @OneToMany(() => ConversationOrm, (conversation) => conversation.folder)
  conversations: ConversationOrm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

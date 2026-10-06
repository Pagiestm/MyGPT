import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConversationOrm } from '../../../conversation/infrastructure/persistence/conversation.orm-entity';
import { UserRole } from '../../domain/user-role.enum';

@Entity('users')
export class UserOrm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  pseudo: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true })
  resetTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiresAt: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  customInstructions: string | null;

  @Column({ type: 'varchar', nullable: true })
  preferredModel: string | null;

  @OneToMany(() => ConversationOrm, (conversation) => conversation.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  conversations: ConversationOrm[];

  @CreateDateColumn()
  created_at: Date;
}

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
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('conversations')
export class Conversation {
  @ApiProperty({
    description: 'Identifiant unique de la conversation',
    example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Titre de la conversation',
    example: 'Comment fonctionne NestJS ?',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: "ID de l'utilisateur propriétaire",
    example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a',
  })
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.conversations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @ApiProperty({
    description: 'Indique si la conversation est publique',
    example: false,
  })
  @Column({ default: false })
  isPublic: boolean;

  @ApiProperty({
    description: 'Lien unique de partage (optionnel)',
    example: 'abc123xyz456',
  })
  @Column({ nullable: true, unique: true })
  shareLink: string;

  @ApiProperty({
    description: "Date d'expiration du lien de partage (optionnel)",
    example: '2025-05-17T16:00:00.000Z',
  })
  @Column({ nullable: true })
  shareExpiresAt: Date;

  @ApiProperty({
    description: 'Date de création de la conversation',
    example: '2025-04-17T14:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-04-17T15:45:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}

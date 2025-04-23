import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Conversation } from '../../conversation/entities/conversation.entity';

@Entity('messages')
export class Message {
  @ApiProperty({
    description: 'Identifiant unique du message',
    example: 'e5f6g7h8-9abc-4def-ghij-kl123456789b',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de la conversation',
    example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a',
  })
  @Column()
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ApiProperty({
    description: 'Contenu du message',
    example: 'Comment puis-je créer un contrôleur dans NestJS ?',
  })
  @Column('text')
  content: string;

  @ApiProperty({
    description: "Indique si le message provient de l'IA",
    example: false,
  })
  @Column({ default: false })
  isFromAi: boolean;

  @ApiProperty({
    description: 'Date de création du message',
    example: '2025-04-17T14:32:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2025-04-17T14:32:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}

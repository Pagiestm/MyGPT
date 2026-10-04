import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Message } from '../../message/entities/message.entity';
import { User } from '../../user/entities/user.entity';

@Entity('attachments')
export class Attachment {
  @ApiProperty({ example: 'a9b8c7d6-1234-4abc-bdef-ff123456789a' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nom du fichier', example: 'schema.png' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Type MIME', example: 'image/png' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets', example: 48213 })
  @Column('int')
  size: number;

  // Contenu binaire : chargé seulement quand on en a besoin, jamais sérialisé
  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'bytea', select: false })
  data: Buffer;

  @ApiProperty()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  messageId: string | null;

  @ManyToOne(() => Message, (message) => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}

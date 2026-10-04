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
import { Conversation } from '../../conversation/entities/conversation.entity';

@Entity('folders')
export class Folder {
  @ApiProperty({ example: 'f1e2d3c4-1234-4abc-bdef-ff123456789a' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nom du dossier', example: 'Cours de JavaScript' })
  @Column()
  name: string;

  @ApiProperty({
    description: "Consignes communes envoyées à l'IA pour les conversations du dossier",
    example: 'Explique comme à un étudiant de première année.',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @ApiProperty({ example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a' })
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Conversation, (conversation) => conversation.folder)
  conversations: Conversation[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

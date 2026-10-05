import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Conversation } from '../../conversation/entities/conversation.entity';
import { UserRole } from '../user-role.enum';

@Entity('users')
export class User {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: "Email de connexion de l'utilisateur",
    example: 'alice@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: "Pseudo de l'utilisateur",
    example: 'alice42',
  })
  @Column({ unique: true })
  pseudo: string;

  @ApiHideProperty()
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description:
      "Rôle de l'utilisateur ; seuls les administrateurs gèrent le catalogue et les rôles",
    enum: UserRole,
    example: UserRole.User,
  })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @ApiProperty({
    description: "Consignes personnalisées envoyées à l'IA avant chaque échange",
    example: 'Réponds de façon concise, avec des exemples en TypeScript.',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  customInstructions?: string | null;

  @ApiProperty({
    description: "Modèle d'IA utilisé par défaut",
    example: 'gemini-3.8-flash',
    required: false,
  })
  @Column({ type: 'varchar', nullable: true })
  preferredModel?: string | null;

  @OneToMany(() => Conversation, (conversation) => conversation.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  conversations: Conversation[];

  @ApiProperty({
    description: 'Date de création du compte',
    example: '2025-04-09T15:23:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;
}

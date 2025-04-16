import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: "Mot de passe de l'utilisateur (hashé)",
    example: '$2b$10$AbC...',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: 'Date de création du compte',
    example: '2025-04-09T15:23:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;
}

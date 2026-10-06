import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../domain/user-role.enum';
import type { User } from '../../../domain/user';

export class UserResponse {
  @ApiProperty({ example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a' })
  id: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'alice42' })
  pseudo: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role: UserRole;

  static from(user: User): UserResponse {
    return { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role };
  }
}

export class DirectoryEntryResponse extends UserResponse {
  @ApiProperty({ example: '2025-04-09T15:23:00.000Z' })
  created_at: Date;

  static from(user: User): DirectoryEntryResponse {
    return { ...UserResponse.from(user), created_at: user.createdAt };
  }
}

export class PreferencesResponse {
  @ApiProperty({ nullable: true, example: 'Réponds de façon concise.' })
  customInstructions: string | null;

  @ApiProperty({ nullable: true, example: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC' })
  preferredModel: string | null;

  static from(user: User): PreferencesResponse {
    return {
      customInstructions: user.customInstructions,
      preferredModel: user.preferredModel,
    };
  }
}

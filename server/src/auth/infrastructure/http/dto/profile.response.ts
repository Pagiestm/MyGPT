import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../user/domain/user-role.enum';
import type { User } from '../../../../user/domain/user';

export class ProfileResponse {
  @ApiProperty({ example: 'alice42' })
  pseudo: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ nullable: true })
  customInstructions: string | null;

  @ApiProperty({ nullable: true })
  preferredModel: string | null;

  static from(user: User): ProfileResponse {
    return {
      pseudo: user.pseudo,
      email: user.email,
      role: user.role,
      customInstructions: user.customInstructions,
      preferredModel: user.preferredModel,
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class UpdateRoleDto {
  @ApiProperty({ description: "Nouveau rôle de l'utilisateur", enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

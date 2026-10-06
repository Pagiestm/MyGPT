import type { Request } from 'express';
import type { UserRole } from '../../user/domain/user-role.enum';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; pseudo: string; role: UserRole };
}

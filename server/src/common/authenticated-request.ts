import type { Request } from 'express';
import type { UserRole } from '../user/user-role.enum';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; pseudo: string; role: UserRole };
}

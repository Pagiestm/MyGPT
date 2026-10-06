import type { Page, PaginationDto } from '../../common/http/pagination.dto';
import type { User } from './user';

export const USER_REPOSITORY = Symbol('UserRepository');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPseudo(pseudo: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByResetToken(tokenHash: string): Promise<User | null>;
  list(pagination: PaginationDto): Promise<Page<User>>;
  countAdmins(): Promise<number>;
  save(user: User): Promise<User>;
  remove(id: string): Promise<void>;
}

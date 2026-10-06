import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pageBounds, toPage, type Page, type PaginationDto } from '../../../common/pagination.dto';
import { User } from '../../domain/user';
import { UserRole } from '../../domain/user-role.enum';
import type { UserRepository } from '../../domain/user.repository';
import { UserOrm } from './user.orm-entity';

@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(@InjectRepository(UserOrm) private readonly users: Repository<UserOrm>) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findByPseudo(pseudo: string): Promise<User | null> {
    const row = await this.users.findOne({ where: { pseudo } });
    return row ? toDomain(row) : null;
  }

  async list(pagination: PaginationDto): Promise<Page<User>> {
    const [rows, total] = await this.users.findAndCount({
      order: { created_at: 'ASC' },
      ...pageBounds(pagination),
    });
    return toPage(rows.map(toDomain), total, pagination);
  }

  countAdmins(): Promise<number> {
    return this.users.countBy({ role: UserRole.Admin });
  }

  async save(user: User): Promise<User> {
    const saved = await this.users.save(this.users.create(toOrm(user)));
    return toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.users.delete(id);
  }
}

function toDomain(row: UserOrm): User {
  return User.rehydrate({
    id: row.id,
    email: row.email,
    pseudo: row.pseudo,
    passwordHash: row.password,
    role: row.role,
    customInstructions: row.customInstructions ?? null,
    preferredModel: row.preferredModel ?? null,
    createdAt: row.created_at,
  });
}

function toOrm(user: User): Partial<UserOrm> {
  return {
    ...(user.id ? { id: user.id } : {}),
    email: user.email,
    pseudo: user.pseudo,
    password: user.passwordHash,
    role: user.role,
    customInstructions: user.customInstructions,
    preferredModel: user.preferredModel,
  };
}

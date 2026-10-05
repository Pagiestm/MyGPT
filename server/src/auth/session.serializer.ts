import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import type { UserRole } from '../user/user-role.enum';

interface SessionPayload {
  id: string;
}

export interface SessionUser {
  id: string;
  email: string;
  pseudo: string;
  role: UserRole;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {
    super();
  }

  serializeUser(
    user: { id?: string },
    done: (err: Error | null, payload: SessionPayload | null) => void,
  ): void {
    if (!user?.id) {
      done(new Error('Structure utilisateur invalide'), null);
      return;
    }
    done(null, { id: user.id });
  }

  deserializeUser(
    payload: SessionPayload,
    done: (err: Error | null, user: SessionUser | null) => void,
  ): void {
    this.users
      .findOne({
        where: { id: payload?.id },
        select: { id: true, email: true, pseudo: true, role: true },
      })
      .then((user) => done(null, user ?? null))
      .catch((error: Error) => done(error, null));
  }
}

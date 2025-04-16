import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

interface UserEntity {
  id: string;
  email: string;
  pseudo: string;
}

interface SerializedUser {
  id: string;
  email: string;
  pseudo: string;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: UserEntity,
    done: (err: Error | null, user: SerializedUser | null) => void,
  ): void {
    try {
      if (!user || !user.id || !user.email || !user.pseudo) {
        done(new Error('Structure utilisateur invalide'), null);
        return;
      }

      done(null, {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
      });
    } catch (error) {
      done(error as Error, null);
    }
  }

  deserializeUser(
    payload: SerializedUser,
    done: (err: Error | null, user: SerializedUser | null) => void,
  ): void {
    try {
      done(null, payload);
    } catch (error) {
      done(error as Error, null);
    }
  }
}

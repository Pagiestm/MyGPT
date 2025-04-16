import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Session } from 'express-session';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user.password) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      return {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Identifiants invalides');
    }
  }

  login(): { message: string } {
    return { message: 'Connexion réussie' };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findOne(userId);

    return {
      pseudo: user.pseudo,
      email: user.email,
    };
  }

  logout(session: Session | undefined, res: Response): { message: string } {
    // Destruction de la session
    if (session) {
      session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
    }

    // Suppression du cookie
    const cookieName = `ca_sid_${crypto
      .createHash('sha256')
      .update('mygpt-salt')
      .digest('hex')
      .substring(0, 8)}`;

    res.clearCookie(cookieName);

    return { message: 'Déconnexion réussie' };
  }
}

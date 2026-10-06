import { Controller, Post, UseGuards, Request, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { SESSION_COOKIE } from '../../../common/session-cookie';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { ThrottleAuth } from '../../../common/decorators/throttle-auth.decorator';
import { GetProfile } from '../../application/auth.use-cases';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { GoogleAuthGuard, GoogleCallbackGuard } from './guards/google-auth.guard';
import { googleOauthConfig } from '../../google.config';
import { LoginDto } from './dto/login.dto';
import { ProfileResponse } from './dto/profile.response';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly profile: GetProfile) {}

  @UseGuards(LocalAuthGuard)
  @ThrottleAuth()
  @Post('login')
  @ApiOperation({ summary: 'Connecte un utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur connecté avec succès',
    schema: { properties: { message: { type: 'string', example: 'Connexion réussie' } } },
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  login(@Request() req: AuthenticatedRequest) {
    return { message: 'Connexion réussie', user: { pseudo: req.user.pseudo } };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Moyens de connexion proposés par cette instance' })
  @ApiResponse({ status: 200, schema: { properties: { google: { type: 'boolean' } } } })
  providers(): { google: boolean } {
    return { google: !!googleOauthConfig() };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Démarrer la connexion avec Google' })
  signInWithGoogle(): void {}

  @UseGuards(GoogleCallbackGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Retour de Google : ouvre la session et renvoie vers le client' })
  googleCallback(@Request() req: AuthenticatedRequest, @Res() res: Response): void {
    const client = (process.env.CLIENT_URL ?? 'http://localhost:5173').split(',')[0].trim();
    res.redirect(`${client}/chat`);
    void req;
  }

  @UseGuards(AuthenticatedGuard)
  @Get('profile')
  @ApiOperation({ summary: "Récupère le profil de l'utilisateur connecté" })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: ProfileResponse })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<ProfileResponse> {
    return ProfileResponse.from(await this.profile.execute(req.user.id));
  }

  @Post('logout')
  @ApiOperation({ summary: "Déconnecte l'utilisateur" })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    schema: { properties: { message: { type: 'string', example: 'Déconnexion réussie' } } },
  })
  logout(@Request() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    req.session?.destroy(() => {});
    res.clearCookie(SESSION_COOKIE);
    return { message: 'Déconnexion réussie' };
  }
}

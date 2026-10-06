import { Controller, Post, UseGuards, Request, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { SESSION_COOKIE } from '../../../common/session-cookie';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { ThrottleAuth } from '../../../common/decorators/throttle-auth.decorator';
import { GetProfile } from '../../application/auth.use-cases';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
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

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { isBrowserModel } from '../../../chat/domain/prompt';
import { Roles } from '../../../auth/infrastructure/http/decorators/roles.decorator';
import { UserRole } from '../../domain/user-role.enum';
import { RolesGuard } from '../../../auth/infrastructure/http/guards/roles.guard';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/http/authenticated-request';
import { PaginationDto, toPage } from '../../../common/http/pagination.dto';
import { ThrottleAuth } from '../../../common/http/throttle-auth.decorator';
import {
  ChangeEmail,
  ChangePassword,
  ChangePseudo,
  ChangeRole,
  DeleteAccount,
  ListUsers,
  RegisterUser,
  UpdatePreferences,
} from '../../application/user.use-cases';
import { RequestPasswordReset, ResetPassword } from '../../application/password-reset.use-cases';
import { smtpConfigured } from '../../../common/mail/smtp.mailer';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePseudoDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DirectoryEntryResponse, PreferencesResponse, UserResponse } from './dto/user.response';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly changePseudo: ChangePseudo,
    private readonly updatePreferences: UpdatePreferences,
    private readonly deleteAccount: DeleteAccount,
    private readonly listUsers: ListUsers,
    private readonly changeRole: ChangeRole,
    private readonly changePassword: ChangePassword,
    private readonly changeEmail: ChangeEmail,
    private readonly requestReset: RequestPasswordReset,
    private readonly resetPassword: ResetPassword,
  ) {}

  @ThrottleAuth()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User has been successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() dto: CreateUserDto): Promise<{ message: string }> {
    await this.registerUser.execute(dto);
    return { message: 'Inscription réussie!' };
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/pseudo')
  @ApiOperation({ summary: "Modification du pseudo de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Pseudo modifié avec succès' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Pseudo déjà utilisé.' })
  async updatePseudo(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePseudoDto,
  ): Promise<{ message: string }> {
    const { changed } = await this.changePseudo.execute(req.user.id, dto.pseudo);
    return {
      message: changed
        ? 'Pseudo modifié avec succès!'
        : 'Aucune modification nécessaire, même pseudo.',
    };
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/preferences')
  @ApiOperation({ summary: "Consignes personnalisées et modèle d'IA par défaut" })
  @ApiResponse({ status: 200, type: PreferencesResponse })
  async setPreferences(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<PreferencesResponse> {
    if (dto.preferredModel && !isBrowserModel(dto.preferredModel)) {
      throw new BadRequestException("Ce modèle n'est pas disponible");
    }
    return PreferencesResponse.from(await this.updatePreferences.execute(req.user.id, dto));
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Changer son mot de passe' })
  @ApiResponse({ status: 204, description: 'Mot de passe changé' })
  @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
  async updatePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.changePassword.execute(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/email')
  @ApiOperation({ summary: 'Changer son email, confirmé par le mot de passe' })
  @ApiResponse({ status: 200, type: UserResponse })
  @ApiResponse({ status: 401, description: 'Mot de passe incorrect' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async updateEmail(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangeEmailDto,
  ): Promise<UserResponse> {
    return UserResponse.from(await this.changeEmail.execute(req.user.id, dto.email, dto.password));
  }

  @ThrottleAuth()
  @Post('password/forgot')
  @HttpCode(202)
  @ApiOperation({ summary: 'Demander un lien de réinitialisation' })
  @ApiResponse({ status: 202, description: 'Demande acceptée, sans révéler si le compte existe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    const client = (process.env.CLIENT_URL ?? 'http://localhost:5173').split(',')[0].trim();
    await this.requestReset.execute(dto.email, client);
    return {
      message: 'Si un compte existe pour cet email, un lien vient de lui être envoyé.',
    };
  }

  @ThrottleAuth()
  @Post('password/reset')
  @HttpCode(204)
  @ApiOperation({ summary: 'Choisir un nouveau mot de passe avec le jeton reçu' })
  @ApiResponse({ status: 204, description: 'Mot de passe remplacé' })
  @ApiResponse({ status: 400, description: 'Lien expiré ou déjà utilisé' })
  async applyReset(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.resetPassword.execute(dto.token, dto.password);
  }

  @Get('password/recovery')
  @ApiOperation({ summary: 'Cette instance sait-elle envoyer un lien de réinitialisation ?' })
  @ApiResponse({ status: 200, schema: { properties: { byEmail: { type: 'boolean' } } } })
  recovery(): { byEmail: boolean } {
    return { byEmail: smtpConfigured() };
  }

  @Get()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Annuaire des comptes et de leurs rôles' })
  async listAll(@Query() pagination: PaginationDto) {
    const page = await this.listUsers.execute(pagination);
    return toPage(
      page.items.map((item) => DirectoryEntryResponse.from(item)),
      page.total,
      pagination,
    );
  }

  @Patch(':id/role')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Changer le rôle d'un compte" })
  @ApiResponse({ status: 200, type: UserResponse })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserResponse> {
    return UserResponse.from(await this.changeRole.execute(id, dto.role));
  }

  @Delete('profile')
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Supprimer le compte de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Compte supprimé avec succès',
    schema: { properties: { message: { type: 'string' } } },
  })
  async remove(@Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    await this.deleteAccount.execute(req.user.id);
    req.session.destroy(() => {});
    return { message: 'Compte utilisateur supprimé avec succès' };
  }
}

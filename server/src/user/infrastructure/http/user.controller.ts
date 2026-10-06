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
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { PaginationDto, toPage } from '../../../common/pagination.dto';
import { ThrottleAuth } from '../../../common/decorators/throttle-auth.decorator';
import {
  ChangePseudo,
  ChangeRole,
  DeleteAccount,
  ListUsers,
  RegisterUser,
  UpdatePreferences,
} from '../../application/user.use-cases';
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

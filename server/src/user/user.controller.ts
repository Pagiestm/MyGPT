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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { UpdatePseudoDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { isBrowserModel } from '../chat/prompt';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './user-role.enum';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Request as ExpressRequest } from 'express';
import { PaginationDto } from '../common/pagination.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    [key: string]: unknown;
  };
}

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully registered.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/pseudo')
  @ApiOperation({ summary: "Modification du pseudo de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Pseudo modifié avec succès',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Pseudo déjà utilisé.' })
  updatePseudo(@Request() req: AuthenticatedRequest, @Body() updatePseudoDto: UpdatePseudoDto) {
    const userId = req.user.id;
    return this.userService.updatePseudo(userId, updatePseudoDto.pseudo);
  }

  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @Patch('profile/preferences')
  @ApiOperation({ summary: "Consignes personnalisées et modèle d'IA par défaut" })
  @ApiResponse({ status: 200, description: 'Préférences enregistrées' })
  updatePreferences(@Request() req: AuthenticatedRequest, @Body() dto: UpdatePreferencesDto) {
    if (dto.preferredModel && !isBrowserModel(dto.preferredModel)) {
      throw new BadRequestException("Ce modèle n'est pas disponible");
    }
    return this.userService.updatePreferences(req.user.id, dto);
  }

  @Get()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Annuaire des comptes et de leurs rôles' })
  listAll(@Query() pagination: PaginationDto) {
    return this.userService.listAll(pagination);
  }

  @Patch(':id/role')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Changer le rôle d'un compte" })
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.userService.updateRole(id, dto.role);
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
  async deleteAccount(@Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    const result = await this.userService.deleteAccount(req.user.id);

    req.session.destroy(() => {});

    return result;
  }
}

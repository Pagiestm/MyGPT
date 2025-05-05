import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UpdatePseudoDto } from './dto/update-user.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Request as ExpressRequest } from 'express';

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
  updatePseudo(
    @Request() req: AuthenticatedRequest,
    @Body() updatePseudoDto: UpdatePseudoDto,
  ) {
    const userId = req.user.id;
    return this.userService.updatePseudo(userId, updatePseudoDto.pseudo);
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
  async deleteAccount(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const result = await this.userService.deleteAccount(req.user.id);

    // Déconnecter l'utilisateur
    req.session.destroy(() => {});

    return result;
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { ModelsService } from './models.service';
import { CreateAiModelDto, UpdateAiModelDto } from './dto/ai-model.dto';

@ApiTags('models')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard, RolesGuard)
@Controller('models')
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'Modèles proposés, et droit de modifier le catalogue' })
  async list(@Request() req: AuthenticatedRequest) {
    return { models: await this.models.available(), canManage: req.user.role === UserRole.Admin };
  }

  @Get('all')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Catalogue complet, modèles désactivés compris' })
  all() {
    return this.models.all();
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ajouter un modèle au catalogue' })
  create(@Body() dto: CreateAiModelDto) {
    return this.models.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Modifier un modèle, ou forcer le retéléchargement de ses poids' })
  update(@Param('id') id: string, @Body() dto: UpdateAiModelDto) {
    return this.models.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Retirer un modèle du catalogue' })
  remove(@Param('id') id: string) {
    return this.models.remove(id);
  }
}

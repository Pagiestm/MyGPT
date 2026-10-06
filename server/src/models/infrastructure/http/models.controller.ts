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
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/http/authenticated-request';
import { Roles } from '../../../auth/infrastructure/http/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/infrastructure/http/guards/roles.guard';
import { UserRole } from '../../../user/domain/user-role.enum';
import {
  AddModel,
  ListAllModels,
  ListAvailableModels,
  RemoveModel,
  UpdateModel,
} from '../../application/ai-model.use-cases';
import { CreateAiModelDto, UpdateAiModelDto } from './dto/ai-model.dto';
import { AiModelResponse } from './dto/ai-model.response';

@ApiTags('models')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard, RolesGuard)
@Controller('models')
export class ModelsController {
  constructor(
    private readonly available: ListAvailableModels,
    private readonly everything: ListAllModels,
    private readonly addModel: AddModel,
    private readonly updateModel: UpdateModel,
    private readonly removeModel: RemoveModel,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Modèles proposés, et droit de modifier le catalogue' })
  async list(@Request() req: AuthenticatedRequest) {
    const models = await this.available.execute();
    return {
      models: models.map((model) => AiModelResponse.from(model)),
      canManage: req.user.role === UserRole.Admin,
    };
  }

  @Get('all')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Catalogue complet, modèles désactivés compris' })
  @ApiResponse({ status: 200, type: [AiModelResponse] })
  async all(): Promise<AiModelResponse[]> {
    const models = await this.everything.execute();
    return models.map((model) => AiModelResponse.from(model));
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ajouter un modèle au catalogue' })
  @ApiResponse({ status: 201, type: AiModelResponse })
  async create(@Body() dto: CreateAiModelDto): Promise<AiModelResponse> {
    return AiModelResponse.from(await this.addModel.execute(dto));
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Modifier un modèle, ou forcer le retéléchargement de ses poids' })
  @ApiResponse({ status: 200, type: AiModelResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateAiModelDto): Promise<AiModelResponse> {
    return AiModelResponse.from(await this.updateModel.execute(id, dto));
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Retirer un modèle du catalogue' })
  remove(@Param('id') id: string) {
    return this.removeModel.execute(id);
  }
}

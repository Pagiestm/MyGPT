import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/http/authenticated-request';
import {
  CreateFolder,
  DeleteFolder,
  ListFolders,
  UpdateFolder,
} from '../../application/folder.use-cases';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { FolderResponse } from './dto/folder.response';

@ApiTags('folders')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('folders')
export class FolderController {
  constructor(
    private readonly list: ListFolders,
    private readonly createFolder: CreateFolder,
    private readonly updateFolder: UpdateFolder,
    private readonly deleteFolder: DeleteFolder,
  ) {}

  @Get()
  @ApiOperation({ summary: "Lister les dossiers de l'utilisateur" })
  @ApiResponse({ status: 200, type: [FolderResponse] })
  async findAll(@Request() req: AuthenticatedRequest): Promise<FolderResponse[]> {
    const folders = await this.list.execute(req.user.id);
    return folders.map((folder) => FolderResponse.from(folder));
  }

  @Post()
  @ApiOperation({ summary: 'Créer un dossier' })
  @ApiResponse({ status: 201, type: FolderResponse })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateFolderDto,
  ): Promise<FolderResponse> {
    return FolderResponse.from(await this.createFolder.execute(req.user.id, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renommer un dossier ou modifier ses consignes' })
  @ApiResponse({ status: 200, type: FolderResponse })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ): Promise<FolderResponse> {
    return FolderResponse.from(await this.updateFolder.execute(id, req.user.id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un dossier (ses conversations sont conservées)' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.deleteFolder.execute(id, req.user.id);
  }
}

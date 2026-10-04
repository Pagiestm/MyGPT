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
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { Folder } from './entities/folder.entity';
import { FolderService } from './folder.service';

@ApiTags('folders')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  @ApiOperation({ summary: "Lister les dossiers de l'utilisateur" })
  @ApiResponse({ status: 200, type: [Folder] })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.folderService.findAllForUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un dossier' })
  @ApiResponse({ status: 201, type: Folder })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateFolderDto) {
    return this.folderService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renommer un dossier ou modifier ses consignes' })
  @ApiResponse({ status: 200, type: Folder })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un dossier (ses conversations sont conservées)' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.folderService.remove(id, req.user.id);
  }
}

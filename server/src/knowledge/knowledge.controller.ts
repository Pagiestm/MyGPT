import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../common/authenticated-request';
import { KnowledgeService, MAX_DOCUMENT_SIZE } from './knowledge.service';
import { ListDocumentsDto, StoreDocumentDto } from './dto/knowledge.dto';

@ApiTags('knowledge')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'Documents indexés' })
  list(@Request() req: AuthenticatedRequest, @Query() query: ListDocumentsDto) {
    return this.knowledge.list(req.user.id, query.folderId, query);
  }

  @Post('chunks')
  @ApiOperation({ summary: 'Découper un document en extraits, sans rien enregistrer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_SIZE + 1 } }))
  split(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return this.knowledge.split(file);
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer un document et ses extraits vectorisés' })
  store(@Request() req: AuthenticatedRequest, @Body() dto: StoreDocumentDto) {
    return this.knowledge.store(req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Retirer un document et ses fragments' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.knowledge.remove(req.user.id, id);
  }
}

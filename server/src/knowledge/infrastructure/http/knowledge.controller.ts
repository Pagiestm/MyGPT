import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import type { Page } from '../../../common/pagination.dto';
import { MAX_DOCUMENT_SIZE } from '../../domain/knowledge-document';
import {
  ListDocuments,
  RemoveDocument,
  SearchDocuments,
  SplitDocumentIntoChunks,
  StoreDocument,
} from '../../application/knowledge.use-cases';
import { ListDocumentsDto, SearchKnowledgeDto, StoreDocumentDto } from './dto/knowledge.dto';
import { KnowledgeDocumentResponse, KnowledgeMatchResponse } from './dto/knowledge.response';

@ApiTags('knowledge')
@ApiCookieAuth()
@UseGuards(AuthenticatedGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly listDocuments: ListDocuments,
    private readonly splitDocument: SplitDocumentIntoChunks,
    private readonly storeDocument: StoreDocument,
    private readonly removeDocument: RemoveDocument,
    private readonly searchDocuments: SearchDocuments,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Documents indexés' })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListDocumentsDto,
  ): Promise<Page<KnowledgeDocumentResponse>> {
    const page = await this.listDocuments.execute(req.user.id, query.folderId, query);
    return { ...page, items: page.items.map((item) => KnowledgeDocumentResponse.from(item)) };
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
    return this.splitDocument.execute({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer un document et ses extraits vectorisés' })
  async store(
    @Request() req: AuthenticatedRequest,
    @Body() dto: StoreDocumentDto,
  ): Promise<KnowledgeDocumentResponse> {
    return KnowledgeDocumentResponse.from(await this.storeDocument.execute(req.user.id, dto));
  }

  @Post('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Chercher un extrait dans ses documents' })
  @ApiResponse({ status: 200, type: [KnowledgeMatchResponse] })
  async search(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SearchKnowledgeDto,
  ): Promise<KnowledgeMatchResponse[]> {
    const matches = await this.searchDocuments.execute(req.user.id, dto.embedding, {
      folderId: dto.folderId,
      limit: dto.limit,
    });
    return matches.map((match) => KnowledgeMatchResponse.from(match));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Retirer un document et ses fragments' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.removeDocument.execute(req.user.id, id);
  }
}

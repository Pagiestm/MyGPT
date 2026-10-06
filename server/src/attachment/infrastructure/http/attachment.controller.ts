import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthenticatedGuard } from '../../../auth/infrastructure/http/guards/authenticated.guard';
import type { AuthenticatedRequest } from '../../../common/authenticated-request';
import { MAX_FILE_SIZE } from '../../domain/attachment';
import { ReadAttachment, UploadAttachment } from '../../application/attachment.use-cases';
import { AttachmentResponse } from './dto/attachment.response';

@ApiTags('attachments')
@Controller('attachments')
export class AttachmentController {
  constructor(
    private readonly uploadAttachment: UploadAttachment,
    private readonly readAttachment: ReadAttachment,
  ) {}

  @Post()
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Envoyer un fichier à joindre à un prochain message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE + 1 } }))
  async upload(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AttachmentResponse> {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    const saved = await this.uploadAttachment.execute(req.user.id, {
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
    });
    return AttachmentResponse.from(saved);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Télécharger un fichier joint (propriétaire ou conversation partagée)' })
  async download(
    @Request() req: ExpressRequest & { user?: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const file = await this.readAttachment.execute(id, req.user?.id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(file.data);
  }
}

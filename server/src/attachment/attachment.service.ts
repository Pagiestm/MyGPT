import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 5;

const NATIVE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const TEXT_EXTENSIONS =
  /\.(txt|md|csv|json|xml|ya?ml|html?|css|scss|js|jsx|ts|tsx|vue|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|sql|sh|ps1|env|ini|toml|log)$/i;

export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AttachmentService {
  constructor(@InjectRepository(Attachment) private readonly attachments: Repository<Attachment>) {}

  async upload(userId: string, file: UploadedFileInput) {
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Le fichier dépasse 10 Mo');
    const mimeType = this.normalizeType(file);

    const saved = await this.attachments.save(
      this.attachments.create({
        name: file.originalname,
        mimeType,
        size: file.size,
        data: file.buffer,
        userId,
      }),
    );
    return { id: saved.id, name: saved.name, mimeType: saved.mimeType, size: saved.size };
  }

  async linkToMessage(ids: string[], userId: string, messageId: string) {
    if (ids.length === 0) return;
    if (ids.length > MAX_FILES_PER_MESSAGE) {
      throw new BadRequestException('5 fichiers maximum par message');
    }
    const available = await this.attachments.find({
      where: { id: In(ids), userId, messageId: IsNull() },
    });
    if (available.length !== ids.length) {
      throw new BadRequestException('Fichier joint introuvable ou déjà utilisé');
    }
    await this.attachments.update(ids, { messageId });
  }

  findForAi(messageId: string) {
    return this.attachments.find({
      where: { messageId },
      select: { id: true, name: true, mimeType: true, data: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findReadable(id: string, userId: string | undefined) {
    const attachment = await this.attachments
      .createQueryBuilder('attachment')
      .addSelect('attachment.data')
      .leftJoinAndSelect('attachment.message', 'message')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .where('attachment.id = :id', { id })
      .getOne();

    const conversation = attachment?.message?.conversation;
    const shared =
      !!conversation?.shareLink &&
      (!conversation.shareExpiresAt || new Date(conversation.shareExpiresAt) > new Date());

    if (!attachment || (attachment.userId !== userId && !shared)) {
      throw new NotFoundException('Fichier introuvable');
    }
    return attachment;
  }

  private normalizeType(file: UploadedFileInput) {
    if (NATIVE_TYPES.has(file.mimetype)) return file.mimetype;
    if (file.mimetype.startsWith('text/') || TEXT_EXTENSIONS.test(file.originalname)) {
      return 'text/plain';
    }
    throw new BadRequestException(
      'Type de fichier non pris en charge : images, PDF ou fichiers texte uniquement',
    );
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Attachment, type UploadedFile } from '../domain/attachment';
import { ATTACHMENT_ACCESS, type AttachmentAccess } from '../domain/attachment-access';
import { ATTACHMENT_REPOSITORY, type AttachmentRepository } from '../domain/attachment.repository';
import { DomainError } from '../../common/domain/domain-error';

@Injectable()
export class UploadAttachment {
  constructor(@Inject(ATTACHMENT_REPOSITORY) private readonly attachments: AttachmentRepository) {}

  execute(userId: string, file: UploadedFile): Promise<Attachment> {
    return this.attachments.save(Attachment.accept(userId, file));
  }
}

@Injectable()
export class LinkAttachmentsToMessage {
  constructor(@Inject(ATTACHMENT_REPOSITORY) private readonly attachments: AttachmentRepository) {}

  async execute(ids: string[], userId: string, messageId: string): Promise<void> {
    if (ids.length === 0) return;
    Attachment.assertBatchSize(ids.length);

    const available = await this.attachments.findUnlinked(ids, userId);
    if (available.length !== ids.length) {
      throw new DomainError('Fichier joint introuvable ou déjà utilisé');
    }
    await this.attachments.linkToMessage(ids, messageId);
  }
}

@Injectable()
export class ListAttachmentsForAi {
  constructor(@Inject(ATTACHMENT_REPOSITORY) private readonly attachments: AttachmentRepository) {}

  execute(messageId: string): Promise<Attachment[]> {
    return this.attachments.findForMessage(messageId);
  }
}

@Injectable()
export class ReadAttachment {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY) private readonly attachments: AttachmentRepository,
    @Inject(ATTACHMENT_ACCESS) private readonly access: AttachmentAccess,
  ) {}

  async execute(id: string, userId: string | undefined): Promise<Attachment> {
    const attachment = await this.attachments.findById(id);
    if (!attachment) throw new NotFoundException('Fichier introuvable');

    if (attachment.belongsTo(userId)) return attachment;
    if (
      attachment.messageId &&
      (await this.access.isSharedPublicly(attachment.messageId, new Date()))
    ) {
      return attachment;
    }
    throw new NotFoundException('Fichier introuvable');
  }
}

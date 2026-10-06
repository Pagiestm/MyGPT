import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AttachmentAccess } from '../../domain/attachment-access';
import { MessageOrm } from '../../../message/infrastructure/persistence/message.orm-entity';

@Injectable()
export class TypeormAttachmentAccess implements AttachmentAccess {
  constructor(@InjectRepository(MessageOrm) private readonly messages: Repository<MessageOrm>) {}

  async isSharedPublicly(messageId: string, now: Date): Promise<boolean> {
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: { conversation: true },
    });
    const conversation = message?.conversation;
    if (!conversation?.shareLink) return false;
    return !conversation.shareExpiresAt || new Date(conversation.shareExpiresAt) > now;
  }
}

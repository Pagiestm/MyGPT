import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageOrm } from '../message/infrastructure/persistence/message.orm-entity';
import { ATTACHMENT_ACCESS } from './domain/attachment-access';
import { ATTACHMENT_REPOSITORY } from './domain/attachment.repository';
import {
  LinkAttachmentsToMessage,
  ListAttachmentsForAi,
  ReadAttachment,
  UploadAttachment,
} from './application/attachment.use-cases';
import { AttachmentOrm } from './infrastructure/persistence/attachment.orm-entity';
import { TypeormAttachmentRepository } from './infrastructure/persistence/typeorm-attachment.repository';
import { TypeormAttachmentAccess } from './infrastructure/persistence/typeorm-attachment-access';
import { AttachmentController } from './infrastructure/http/attachment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentOrm, MessageOrm])],
  controllers: [AttachmentController],
  providers: [
    { provide: ATTACHMENT_REPOSITORY, useClass: TypeormAttachmentRepository },
    { provide: ATTACHMENT_ACCESS, useClass: TypeormAttachmentAccess },
    UploadAttachment,
    LinkAttachmentsToMessage,
    ListAttachmentsForAi,
    ReadAttachment,
  ],
  exports: [LinkAttachmentsToMessage, ListAttachmentsForAi],
})
export class AttachmentModule {}

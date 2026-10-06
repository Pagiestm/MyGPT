import type { Attachment } from './attachment';

export const ATTACHMENT_REPOSITORY = Symbol('AttachmentRepository');

export interface AttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  findUnlinked(ids: string[], userId: string): Promise<Attachment[]>;
  findForMessage(messageId: string): Promise<Attachment[]>;
  save(attachment: Attachment): Promise<Attachment>;
  linkToMessage(ids: string[], messageId: string): Promise<void>;
}

export const ATTACHMENT_ACCESS = Symbol('AttachmentAccess');

export interface AttachmentAccess {
  isSharedPublicly(messageId: string, now: Date): Promise<boolean>;
}

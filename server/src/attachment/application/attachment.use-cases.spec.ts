import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DomainError } from '../../common/domain/domain-error';
import { Attachment } from '../domain/attachment';
import { ATTACHMENT_ACCESS } from '../domain/attachment-access';
import { ATTACHMENT_REPOSITORY } from '../domain/attachment.repository';
import {
  LinkAttachmentsToMessage,
  ListAttachmentsForAi,
  ReadAttachment,
  UploadAttachment,
} from './attachment.use-cases';

const stored = (overrides: Partial<Parameters<typeof Attachment.rehydrate>[0]> = {}) =>
  Attachment.rehydrate({
    id: 'a1',
    name: 'notes.md',
    mimeType: 'text/plain',
    size: 7,
    data: Buffer.from('Bonjour'),
    userId: 'u1',
    messageId: null,
    createdAt: new Date(),
    ...overrides,
  });

describe('Attachment use cases', () => {
  const attachments = {
    findById: jest.fn(),
    findUnlinked: jest.fn(),
    findForMessage: jest.fn(),
    save: jest.fn((saved: Attachment) => Promise.resolve(saved)),
    linkToMessage: jest.fn(),
  };
  const access = { isSharedPublicly: jest.fn() };

  let upload: UploadAttachment;
  let link: LinkAttachmentsToMessage;
  let forAi: ListAttachmentsForAi;
  let read: ReadAttachment;

  beforeEach(async () => {
    jest.clearAllMocks();
    access.isSharedPublicly.mockResolvedValue(false);

    const module = await Test.createTestingModule({
      providers: [
        UploadAttachment,
        LinkAttachmentsToMessage,
        ListAttachmentsForAi,
        ReadAttachment,
        { provide: ATTACHMENT_REPOSITORY, useValue: attachments },
        { provide: ATTACHMENT_ACCESS, useValue: access },
      ],
    }).compile();

    upload = module.get(UploadAttachment);
    link = module.get(LinkAttachmentsToMessage);
    forAi = module.get(ListAttachmentsForAi);
    read = module.get(ReadAttachment);
  });

  describe('UploadAttachment', () => {
    it('stores the normalised file', async () => {
      const saved = await upload.execute('u1', {
        name: 'notes.md',
        mimeType: 'text/markdown',
        size: 7,
        data: Buffer.from('Bonjour'),
      });

      expect(saved.mimeType).toBe('text/plain');
      expect(saved.userId).toBe('u1');
    });
  });

  describe('LinkAttachmentsToMessage', () => {
    it('does nothing when there is no file to link', async () => {
      await link.execute([], 'u1', 'm1');

      expect(attachments.linkToMessage).not.toHaveBeenCalled();
    });

    it('refuses a batch above the limit before querying anything', async () => {
      await expect(link.execute(['1', '2', '3', '4', '5', '6'], 'u1', 'm1')).rejects.toThrow(
        DomainError,
      );
      expect(attachments.findUnlinked).not.toHaveBeenCalled();
    });

    it('refuses a file that is missing or already used', async () => {
      attachments.findUnlinked.mockResolvedValue([stored()]);

      await expect(link.execute(['a1', 'a2'], 'u1', 'm1')).rejects.toThrow(
        /introuvable ou déjà utilisé/,
      );
      expect(attachments.linkToMessage).not.toHaveBeenCalled();
    });

    it('links every file once they are all available', async () => {
      attachments.findUnlinked.mockResolvedValue([stored(), stored({ id: 'a2' })]);

      await link.execute(['a1', 'a2'], 'u1', 'm1');

      expect(attachments.linkToMessage).toHaveBeenCalledWith(['a1', 'a2'], 'm1');
    });
  });

  describe('ListAttachmentsForAi', () => {
    it('reads the files carried by one message', async () => {
      attachments.findForMessage.mockResolvedValue([stored()]);

      await expect(forAi.execute('m1')).resolves.toHaveLength(1);
      expect(attachments.findForMessage).toHaveBeenCalledWith('m1');
    });
  });

  describe('ReadAttachment', () => {
    it('hands the owner their own file', async () => {
      attachments.findById.mockResolvedValue(stored());

      await expect(read.execute('a1', 'u1')).resolves.toMatchObject({ id: 'a1' });
      expect(access.isSharedPublicly).not.toHaveBeenCalled();
    });

    it('hides the file from someone else when nothing is shared', async () => {
      attachments.findById.mockResolvedValue(stored({ messageId: 'm1' }));

      await expect(read.execute('a1', 'u2')).rejects.toThrow(NotFoundException);
    });

    it('opens the file to anyone once its conversation is shared', async () => {
      attachments.findById.mockResolvedValue(stored({ messageId: 'm1' }));
      access.isSharedPublicly.mockResolvedValue(true);

      await expect(read.execute('a1', undefined)).resolves.toMatchObject({ id: 'a1' });
    });

    it('keeps an unattached file private even to an anonymous visitor', async () => {
      attachments.findById.mockResolvedValue(stored());

      await expect(read.execute('a1', undefined)).rejects.toThrow(NotFoundException);
      expect(access.isSharedPublicly).not.toHaveBeenCalled();
    });

    it('reports an unknown file', async () => {
      attachments.findById.mockResolvedValue(null);

      await expect(read.execute('absent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});

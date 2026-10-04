import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentService, type UploadedFileInput } from './attachment.service';
import { Attachment } from './entities/attachment.entity';

const file = (overrides: Partial<UploadedFileInput> = {}): UploadedFileInput => ({
  originalname: 'photo.png',
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('png'),
  ...overrides,
});

describe('AttachmentService', () => {
  let service: AttachmentService;
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const repository = {
    create: jest.fn((data: Partial<Attachment>) => data),
    save: jest.fn((data: Partial<Attachment>) => Promise.resolve({ id: 'a1', ...data })),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AttachmentService,
        { provide: getRepositoryToken(Attachment), useValue: repository },
      ],
    }).compile();
    service = module.get(AttachmentService);
  });

  describe('upload', () => {
    it('stores an image and returns it without its content', async () => {
      const saved = await service.upload('u1', file());

      expect(repository.create).toHaveBeenCalledWith({
        name: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
        data: Buffer.from('png'),
        userId: 'u1',
      });
      expect(saved).not.toHaveProperty('data');
    });

    it('accepts source code sent with a generic type, as text', async () => {
      await service.upload(
        'u1',
        file({ originalname: 'app.ts', mimetype: 'application/octet-stream' }),
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'text/plain' }),
      );
    });

    it('rejects unsupported files', async () => {
      await expect(
        service.upload(
          'u1',
          file({ originalname: 'setup.exe', mimetype: 'application/x-msdownload' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects files larger than 10 MB', async () => {
      await expect(service.upload('u1', file({ size: 11 * 1024 * 1024 }))).rejects.toThrow(
        'Le fichier dépasse 10 Mo',
      );
    });
  });

  describe('linkToMessage', () => {
    it('links the unattached files of the user to the message', async () => {
      repository.find.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

      await service.linkToMessage(['a1', 'a2'], 'u1', 'm1');

      expect(repository.update).toHaveBeenCalledWith(['a1', 'a2'], { messageId: 'm1' });
    });

    it("refuses files that are not the user's or already used", async () => {
      repository.find.mockResolvedValue([{ id: 'a1' }]);

      await expect(service.linkToMessage(['a1', 'a2'], 'u1', 'm1')).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('refuses more than 5 files per message', async () => {
      await expect(
        service.linkToMessage(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], 'u1', 'm1'),
      ).rejects.toThrow('5 fichiers maximum par message');
    });
  });

  describe('findReadable', () => {
    it('gives the owner access to the file', async () => {
      queryBuilder.getOne.mockResolvedValue({ id: 'a1', userId: 'u1', message: null });

      await expect(service.findReadable('a1', 'u1')).resolves.toMatchObject({ id: 'a1' });
    });

    it('gives anyone access when the conversation is shared', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        message: { conversation: { shareLink: 'abc', shareExpiresAt: null } },
      });

      await expect(service.findReadable('a1', undefined)).resolves.toMatchObject({ id: 'a1' });
    });

    it('hides the file from others when the conversation is private', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        message: { conversation: { shareLink: null, shareExpiresAt: null } },
      });

      await expect(service.findReadable('a1', 'u2')).rejects.toThrow(NotFoundException);
    });

    it('hides the file once the share link has expired', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        message: { conversation: { shareLink: 'abc', shareExpiresAt: new Date('2000-01-01') } },
      });

      await expect(service.findReadable('a1', undefined)).rejects.toThrow(NotFoundException);
    });
  });
});

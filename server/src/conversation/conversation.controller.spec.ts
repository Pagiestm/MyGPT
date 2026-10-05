import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { FolderService } from '../folder/folder.service';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { Session, SessionData } from 'express-session';
import { UserRole } from '../user/user-role.enum';

type MockService = Record<keyof ConversationService, jest.Mock>;

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    pseudo: string;
    role: UserRole;
  };
  session: Session & Partial<SessionData>;
}

function createMockRequest(userId: string = 'user-123'): RequestWithUser {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      pseudo: 'testuser',
      role: UserRole.User,
    },
    session: {} as Session & Partial<SessionData>,
  } as RequestWithUser;
}

function createMockConversation(overrides = {}) {
  return {
    id: 'conv-123',
    name: 'Test Conversation',
    userId: 'user-123',
    user: { id: 'user-123' },
    isPublic: false,
    shareLink: null,
    shareExpiresAt: null,
    messages: [],
    sharedFrom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: MockService;
  const folders = { findOwned: jest.fn() };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findOne: jest.fn(),
      findByShareLink: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      shareConversation: jest.fn(),
      revokeShare: jest.fn(),
      saveSharedConversation: jest.fn(),
      findSavedByUser: jest.fn(),
    } as unknown as MockService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        { provide: ConversationService, useValue: service },
        { provide: FolderService, useValue: folders },
      ],
    }).compile();

    controller = module.get<ConversationController>(ConversationController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create a conversation and set userId from request', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const dto = { name: 'New Conversation', userId: 'will-be-overridden' };
        const expected = createMockConversation({ name: dto.name, userId });

        service.create.mockResolvedValue(expected);

        const result = await controller.create(req, dto);

        expect(dto.userId).toBe(userId);
        expect(service.create).toHaveBeenCalledWith(dto);
        expect(result).toBe(expected);
      });
    });

    describe('findAll', () => {
      it('should return all conversations for the logged in user', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const conversations = [
          createMockConversation({ id: 'conv-1' }),
          createMockConversation({ id: 'conv-2' }),
        ];

        service.findAll.mockResolvedValue(conversations);

        const result = await controller.findAll(req, {});

        expect(service.findAll).toHaveBeenCalledWith(userId, { archived: false });
        expect(result).toEqual(conversations);
      });
    });

    describe('search', () => {
      it('should search conversations by keyword for logged in user', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const keyword = 'test';
        const conversations = [createMockConversation({ name: 'Test Conversation' })];

        service.search.mockResolvedValue(conversations);

        const result = await controller.search(req, keyword, {});

        expect(service.search).toHaveBeenCalledWith({ keyword, userId });
        expect(result).toEqual(conversations);
      });
    });

    describe('findOne', () => {
      it('should return a conversation if user owns it', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({ id, userId });

        service.findOne.mockResolvedValue(conversation);

        const result = await controller.findOne(req, id);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(result).toEqual(conversation);
      });

      it('should return a public conversation even if user does not own it', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
          isPublic: true,
        });

        service.findOne.mockResolvedValue(conversation);

        const result = await controller.findOne(req, id);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(result).toEqual(conversation);
      });

      it('should throw BadRequestException if user has no access to private conversation', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
          isPublic: false,
        });

        service.findOne.mockResolvedValue(conversation);

        await expect(controller.findOne(req, id)).rejects.toThrow(BadRequestException);
        expect(service.findOne).toHaveBeenCalledWith(id);
      });
    });

    describe('update', () => {
      it('should update a conversation if user owns it', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const updateDto = { name: 'Updated Name' };

        const originalConversation = createMockConversation({ id, userId });
        const updatedConversation = createMockConversation({
          ...originalConversation,
          ...updateDto,
        });

        service.findOne.mockResolvedValue(originalConversation);
        service.update.mockResolvedValue(updatedConversation);

        const result = await controller.update(req, id, updateDto);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.update).toHaveBeenCalledWith(id, updateDto);
        expect(result).toEqual(updatedConversation);
      });

      it('should throw BadRequestException if user does not own the conversation', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const updateDto = { name: 'Updated Name' };

        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
        });

        service.findOne.mockResolvedValue(conversation);

        await expect(controller.update(req, id, updateDto)).rejects.toThrow(BadRequestException);
        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.update).not.toHaveBeenCalled();
      });
    });

    describe('remove', () => {
      it('should remove a conversation if user owns it', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({ id, userId });

        service.findOne.mockResolvedValue(conversation);

        await controller.remove(req, id);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.remove).toHaveBeenCalledWith(id);
      });

      it('should throw BadRequestException if user does not own the conversation', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
        });

        service.findOne.mockResolvedValue(conversation);

        await expect(controller.remove(req, id)).rejects.toThrow(BadRequestException);
        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.remove).not.toHaveBeenCalled();
      });
    });
  });

  describe('Sharing Operations', () => {
    describe('shareConversation', () => {
      it('should share a conversation if user owns it', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const shareDto = { expiresAt: '2025-01-01T00:00:00.000Z' };

        const conversation = createMockConversation({ id, userId });
        const shareResult = { shareLink: 'abc123' };

        service.findOne.mockResolvedValue(conversation);
        service.shareConversation.mockResolvedValue(shareResult);

        const result = await controller.shareConversation(req, id, shareDto);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.shareConversation).toHaveBeenCalledWith(id, shareDto);
        expect(result).toEqual(shareResult);
      });

      it('should throw BadRequestException if user does not own the conversation', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const shareDto = { expiresAt: '2025-01-01T00:00:00.000Z' };

        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
        });

        service.findOne.mockResolvedValue(conversation);

        await expect(controller.shareConversation(req, id, shareDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.shareConversation).not.toHaveBeenCalled();
      });
    });

    describe('revokeShare', () => {
      it('should revoke share for a conversation if user owns it', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({
          id,
          userId,
          shareLink: 'abc123',
        });

        service.findOne.mockResolvedValue(conversation);

        await controller.revokeShare(req, id);

        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.revokeShare).toHaveBeenCalledWith(id);
      });

      it('should throw BadRequestException if user does not own the conversation', async () => {
        const userId = 'user-456';
        const req = createMockRequest(userId);
        const id = 'conv-123';
        const conversation = createMockConversation({
          id,
          userId: 'user-123', // Différent de req.user.id
          shareLink: 'abc123',
        });

        service.findOne.mockResolvedValue(conversation);

        await expect(controller.revokeShare(req, id)).rejects.toThrow(BadRequestException);
        expect(service.findOne).toHaveBeenCalledWith(id);
        expect(service.revokeShare).not.toHaveBeenCalled();
      });
    });

    describe('findByShareLink', () => {
      it('should return a shared conversation by shareLink', async () => {
        const shareLink = 'abc123';
        const conversation = createMockConversation({ shareLink });

        service.findByShareLink.mockResolvedValue(conversation);

        const result = await controller.findByShareLink(shareLink);

        expect(service.findByShareLink).toHaveBeenCalledWith(shareLink);
        expect(result).toMatchObject({ id: conversation.id, name: conversation.name });
      });

      it('should only expose the author pseudo, never credentials', async () => {
        const conversation = createMockConversation({
          shareLink: 'abc123',
          user: {
            id: 'user-123',
            pseudo: 'alice',
            email: 'alice@example.com',
            password: '$2b$10$hash',
          },
        });
        service.findByShareLink.mockResolvedValue(conversation);

        const result = await controller.findByShareLink('abc123');

        expect(result.user).toEqual({ pseudo: 'alice' });
        expect(JSON.stringify(result)).not.toContain('$2b$10$hash');
        expect(JSON.stringify(result)).not.toContain('alice@example.com');
      });
    });
  });

  describe('Saved Conversations', () => {
    describe('getSavedConversations', () => {
      it('should return all saved conversations for the logged in user', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const savedConversations = [
          createMockConversation({ id: 'saved-1', sharedFrom: 'original-1' }),
          createMockConversation({ id: 'saved-2', sharedFrom: 'original-2' }),
        ];

        service.findSavedByUser.mockResolvedValue(savedConversations);

        const result = await controller.getSavedConversations(req, {});

        expect(service.findSavedByUser).toHaveBeenCalledWith(userId, {});
        expect(result).toEqual(savedConversations);
      });
    });

    describe('saveSharedConversation', () => {
      it('should save a shared conversation for the logged in user', async () => {
        const userId = 'user-123';
        const req = createMockRequest(userId);
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'conv-123',
          newName: 'My Saved Version',
        };

        const savedConversation = createMockConversation({
          id: 'saved-conv-id',
          name: 'My Saved Version',
          sharedFrom: 'conv-123',
        });

        service.saveSharedConversation.mockResolvedValue(savedConversation);

        const result = await controller.saveSharedConversation(req, saveDto);

        expect(service.saveSharedConversation).toHaveBeenCalledWith(userId, saveDto);
        expect(result).toEqual(savedConversation);
      });
    });
  });

  describe('Folders', () => {
    it("refuses to move a conversation into someone else's folder", async () => {
      service.findOne.mockResolvedValue(createMockConversation({ userId: 'user-123' }));
      folders.findOwned.mockRejectedValue(new NotFoundException('Dossier introuvable'));

      await expect(
        controller.update(createMockRequest('user-123'), 'conv-123', { folderId: 'f-autre' }),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it('accepts removing the conversation from its folder', async () => {
      service.findOne.mockResolvedValue(createMockConversation({ userId: 'user-123' }));

      await controller.update(createMockRequest('user-123'), 'conv-123', { folderId: null });

      expect(folders.findOwned).not.toHaveBeenCalled();
      expect(service.update).toHaveBeenCalledWith('conv-123', { folderId: null });
    });
  });
});

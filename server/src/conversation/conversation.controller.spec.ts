import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { BadRequestException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { Request as ExpressRequest } from 'express';
import { Session, SessionData } from 'express-session';

// Interface pour les tests qui reflète celle du contrôleur
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    pseudo: string;
  };
  session: Session & Partial<SessionData>;
}

// Mock du ConversationService
const mockConversationService = {
  create: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  findOne: jest.fn(),
  findByShareLink: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  shareConversation: jest.fn(),
  revokeShare: jest.fn(),
};

// Helper pour créer une requête mock avec user
const createMockRequest = (userId: string = 'user-123'): RequestWithUser => {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      pseudo: 'testuser',
    },
    session: {} as Session & Partial<SessionData>,
  } as RequestWithUser;
};

// Helpers pour éviter les erreurs eslint unbound-method avec des types appropriés
function expectCalledWith(fn: jest.Mock, ...args: unknown[]): void {
  expect(fn).toHaveBeenCalledWith(...args);
}

function expectNotCalled(fn: jest.Mock): void {
  expect(fn).not.toHaveBeenCalled();
}

describe('ConversationController', () => {
  let controller: ConversationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    }).compile();

    controller = module.get<ConversationController>(ConversationController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a conversation and set userId from request', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const createDto: CreateConversationDto = {
        name: 'New Conversation',
        userId: 'ignored', // Ce userId va être écrasé
      };
      const expectedResult = {
        id: 'conversation-123',
        name: 'New Conversation',
        userId,
      };

      mockConversationService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(req, createDto);

      // Assert
      expect(createDto.userId).toBe(userId); // userId doit être celui de la requête
      expectCalledWith(mockConversationService.create, createDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all conversations for the logged in user', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const conversations = [
        { id: 'conversation-1', name: 'Conversation 1', userId },
        { id: 'conversation-2', name: 'Conversation 2', userId },
      ];

      mockConversationService.findAll.mockResolvedValue(conversations);

      // Act
      const result = await controller.findAll(req);

      // Assert
      expectCalledWith(mockConversationService.findAll, userId);
      expect(result).toEqual(conversations);
    });
  });

  describe('search', () => {
    it('should search conversations by keyword for logged in user', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const keyword = 'test';
      const conversations = [
        { id: 'conversation-1', name: 'Test Conversation', userId },
      ];

      mockConversationService.search.mockResolvedValue(conversations);

      // Act
      const result = await controller.search(req, keyword);

      // Assert
      expectCalledWith(mockConversationService.search, { keyword, userId });
      expect(result).toEqual(conversations);
    });
  });

  describe('findByShareLink', () => {
    it('should return a shared conversation by shareLink', async () => {
      // Arrange
      const shareLink = 'abc123';
      const conversation = {
        id: 'conversation-123',
        name: 'Shared Conversation',
        userId: 'user-123',
        shareLink,
      };

      mockConversationService.findByShareLink.mockResolvedValue(conversation);

      // Act
      const result = await controller.findByShareLink(shareLink);

      // Assert
      expectCalledWith(mockConversationService.findByShareLink, shareLink);
      expect(result).toEqual(conversation);
    });
  });

  describe('findOne', () => {
    it('should return a conversation if user owns it', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'My Conversation',
        userId,
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act
      const result = await controller.findOne(req, id);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expect(result).toEqual(conversation);
    });

    it('should return a public conversation even if user does not own it', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Public Conversation',
        userId: 'user-123', // Propriétaire différent
        isPublic: true, // Conversation publique
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act
      const result = await controller.findOne(req, id);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expect(result).toEqual(conversation);
    });

    it('should throw BadRequestException if user has no access to private conversation', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Private Conversation',
        userId: 'user-123', // Propriétaire différent
        isPublic: false, // Conversation privée
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act & Assert
      await expect(controller.findOne(req, id)).rejects.toThrow(
        BadRequestException,
      );
      expectCalledWith(mockConversationService.findOne, id);
    });
  });

  describe('update', () => {
    it('should update a conversation if user owns it', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const updateDto: UpdateConversationDto = { name: 'Updated Name' };
      const originalConversation = {
        id,
        name: 'Original Name',
        userId,
      };
      const updatedConversation = {
        ...originalConversation,
        name: 'Updated Name',
      };

      mockConversationService.findOne.mockResolvedValue(originalConversation);
      mockConversationService.update.mockResolvedValue(updatedConversation);

      // Act
      const result = await controller.update(req, id, updateDto);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expectCalledWith(mockConversationService.update, id, updateDto);
      expect(result).toEqual(updatedConversation);
    });

    it('should throw BadRequestException if user does not own the conversation', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const updateDto: UpdateConversationDto = { name: 'Updated Name' };
      const conversation = {
        id,
        name: 'Original Name',
        userId: 'user-123', // Propriétaire différent
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act & Assert
      await expect(controller.update(req, id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expectCalledWith(mockConversationService.findOne, id);
      expectNotCalled(mockConversationService.update);
    });
  });

  describe('remove', () => {
    it('should remove a conversation if user owns it', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Conversation to delete',
        userId,
      };

      mockConversationService.findOne.mockResolvedValue(conversation);
      mockConversationService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(req, id);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expectCalledWith(mockConversationService.remove, id);
    });

    it('should throw BadRequestException if user does not own the conversation', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Conversation to delete',
        userId: 'user-123', // Propriétaire différent
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act & Assert
      await expect(controller.remove(req, id)).rejects.toThrow(
        BadRequestException,
      );
      expectCalledWith(mockConversationService.findOne, id);
      expectNotCalled(mockConversationService.remove);
    });
  });

  describe('shareConversation', () => {
    it('should share a conversation if user owns it', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const shareDto: ShareConversationDto = {
        expiresAt: '2025-01-01T00:00:00.000Z',
      };
      const conversation = {
        id,
        name: 'Conversation to share',
        userId,
      };
      const shareResult = { shareLink: 'abc123' };

      mockConversationService.findOne.mockResolvedValue(conversation);
      mockConversationService.shareConversation.mockResolvedValue(shareResult);

      // Act
      const result = await controller.shareConversation(req, id, shareDto);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expectCalledWith(mockConversationService.shareConversation, id, shareDto);
      expect(result).toEqual(shareResult);
    });

    it('should throw BadRequestException if user does not own the conversation', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const shareDto: ShareConversationDto = {
        expiresAt: '2025-01-01T00:00:00.000Z',
      };
      const conversation = {
        id,
        name: 'Conversation to share',
        userId: 'user-123', // Propriétaire différent
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act & Assert
      await expect(
        controller.shareConversation(req, id, shareDto),
      ).rejects.toThrow(BadRequestException);
      expectCalledWith(mockConversationService.findOne, id);
      expectNotCalled(mockConversationService.shareConversation);
    });
  });

  describe('revokeShare', () => {
    it('should revoke sharing if user owns the conversation', async () => {
      // Arrange
      const userId = 'user-123';
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Conversation with share',
        userId,
        shareLink: 'abc123',
      };

      mockConversationService.findOne.mockResolvedValue(conversation);
      mockConversationService.revokeShare.mockResolvedValue(undefined);

      // Act
      await controller.revokeShare(req, id);

      // Assert
      expectCalledWith(mockConversationService.findOne, id);
      expectCalledWith(mockConversationService.revokeShare, id);
    });

    it('should throw BadRequestException if user does not own the conversation', async () => {
      // Arrange
      const userId = 'user-456'; // Différent de celui de la conversation
      const req = createMockRequest(userId);
      const id = 'conversation-123';
      const conversation = {
        id,
        name: 'Conversation with share',
        userId: 'user-123', // Propriétaire différent
        shareLink: 'abc123',
      };

      mockConversationService.findOne.mockResolvedValue(conversation);

      // Act & Assert
      await expect(controller.revokeShare(req, id)).rejects.toThrow(
        BadRequestException,
      );
      expectCalledWith(mockConversationService.findOne, id);
      expectNotCalled(mockConversationService.revokeShare);
    });
  });
});

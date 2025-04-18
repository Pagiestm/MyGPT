import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { ConversationService } from '../conversation/conversation.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { BadRequestException } from '@nestjs/common';
import { Message } from './entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
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

function expectCalledWith(fn: jest.Mock, ...args: unknown[]): void {
  expect(fn).toHaveBeenCalledWith(...args);
}

function expectNotCalled(fn: jest.Mock): void {
  expect(fn).not.toHaveBeenCalled();
}

describe('MessageController', () => {
  let controller: MessageController;

  // Mock des services
  const mockMessageService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    searchInConversation: jest.fn(),
  };

  const mockConversationService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a message when user owns the conversation', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const createDto: CreateMessageDto = {
        content: 'Test message',
        conversationId,
        isFromAi: false,
      };

      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      const expectedMessage = {
        id: 'msg-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Message;

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.create.mockResolvedValue(expectedMessage);

      // Act
      const result = await controller.create(req, createDto);

      // Assert
      expectCalledWith(mockConversationService.findOne, conversationId);
      expectCalledWith(mockMessageService.create, createDto);
      expect(result).toEqual(expectedMessage);
    });

    it('should create a message when conversation is public', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const createDto: CreateMessageDto = {
        content: 'Test message',
        conversationId,
        isFromAi: false,
      };

      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: true,
      } as Conversation;

      const expectedMessage = {
        id: 'msg-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Message;

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.create.mockResolvedValue(expectedMessage);

      // Act
      const result = await controller.create(req, createDto);

      // Assert
      expect(result).toEqual(expectedMessage);
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const createDto: CreateMessageDto = {
        content: 'Test message',
        conversationId,
        isFromAi: false,
      };

      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
      } as Conversation;

      // Mock service
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(controller.create(req, createDto)).rejects.toThrow(
        BadRequestException,
      );
      expectNotCalled(mockMessageService.create);
    });
  });

  describe('findAll', () => {
    it('should return all messages for a conversation the user owns', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          conversationId,
          isFromAi: false,
        },
        {
          id: 'msg-2',
          content: 'Hi there',
          conversationId,
          isFromAi: true,
        },
      ] as Message[];

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.findAll.mockResolvedValue(mockMessages);

      // Act
      const result = await controller.findAll(req, conversationId);

      // Assert
      expectCalledWith(mockConversationService.findOne, conversationId);
      expectCalledWith(mockMessageService.findAll, conversationId);
      expect(result).toEqual(mockMessages);
    });

    it('should return messages for a public conversation', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: true,
        shareLink: null,
      } as Conversation;

      const mockMessages = [
        { id: 'msg-1', content: 'Hello', conversationId },
      ] as Message[];

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.findAll.mockResolvedValue(mockMessages);

      // Act
      const result = await controller.findAll(req, conversationId);

      // Assert
      expect(result).toEqual(mockMessages);
    });

    it('should return messages for a shared conversation', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
        shareLink: 'share-link',
      } as Conversation;

      const mockMessages = [
        { id: 'msg-1', content: 'Hello', conversationId },
      ] as Message[];

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.findAll.mockResolvedValue(mockMessages);

      // Act
      const result = await controller.findAll(req, conversationId);

      // Assert
      expect(result).toEqual(mockMessages);
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
        shareLink: null,
      } as Conversation;

      // Mock service
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(controller.findAll(req, conversationId)).rejects.toThrow(
        BadRequestException,
      );
      expectNotCalled(mockMessageService.findAll);
    });
  });

  describe('search', () => {
    it('should search messages in a conversation the user owns', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const keyword = 'test';
      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      const mockMessages = [
        { id: 'msg-1', content: 'Test message', conversationId },
      ] as Message[];

      // Mock services
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.searchInConversation.mockResolvedValue(mockMessages);

      // Act
      const result = await controller.search(req, keyword, conversationId);

      // Assert
      expectCalledWith(mockConversationService.findOne, conversationId);
      expectCalledWith(mockMessageService.searchInConversation, {
        keyword,
        conversationId,
      });
      expect(result).toEqual(mockMessages);
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Arrange
      const req = createMockRequest();
      const conversationId = 'conv-123';
      const keyword = 'test';
      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
        shareLink: null,
      } as Conversation;

      // Mock service
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        controller.search(req, keyword, conversationId),
      ).rejects.toThrow(BadRequestException);
      expectNotCalled(mockMessageService.searchInConversation);
    });
  });

  describe('findOne', () => {
    it('should return a message by ID when user has access', async () => {
      // Arrange
      const req = createMockRequest();
      const messageId = 'msg-123';
      const conversationId = 'conv-123';
      const mockMessage = {
        id: messageId,
        content: 'Test message',
        conversationId,
      } as Message;

      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      // Mock services
      mockMessageService.findOne.mockResolvedValue(mockMessage);
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act
      const result = await controller.findOne(req, messageId);

      // Assert
      expectCalledWith(mockMessageService.findOne, messageId);
      expectCalledWith(mockConversationService.findOne, conversationId);
      expect(result).toEqual(mockMessage);
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Arrange
      const req = createMockRequest();
      const messageId = 'msg-123';
      const conversationId = 'conv-123';
      const mockMessage = {
        id: messageId,
        content: 'Test message',
        conversationId,
      } as Message;

      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
        shareLink: null,
      } as Conversation;

      // Mock services
      mockMessageService.findOne.mockResolvedValue(mockMessage);
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(controller.findOne(req, messageId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a message when user owns the conversation', async () => {
      // Arrange
      const req = createMockRequest();
      const messageId = 'msg-123';
      const conversationId = 'conv-123';
      const updateDto: UpdateMessageDto = {
        content: 'Updated content',
      };

      const mockMessage = {
        id: messageId,
        content: 'Original content',
        conversationId,
        isFromAi: false,
      } as Message;

      const updatedMessage = {
        ...mockMessage,
        content: updateDto.content,
      };

      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      // Mock services
      mockMessageService.findOne.mockResolvedValue(mockMessage);
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.update.mockResolvedValue(updatedMessage);

      // Act
      const result = await controller.update(
        req,
        messageId,
        updateDto,
        'false',
      );

      // Assert
      expectCalledWith(mockMessageService.findOne, messageId);
      expectCalledWith(mockConversationService.findOne, conversationId);
      expectCalledWith(mockMessageService.update, messageId, updateDto, false);
      expect(result).toEqual(updatedMessage);
    });

    it('should update a message with AI regeneration', async () => {
      // Arrange
      const req = createMockRequest();
      const messageId = 'msg-123';
      const conversationId = 'conv-123';
      const updateDto: UpdateMessageDto = {
        content: 'Updated content',
      };

      const mockMessage = {
        id: messageId,
        content: 'Original content',
        conversationId,
        isFromAi: false,
      } as Message;

      const updatedMessage = {
        ...mockMessage,
        content: updateDto.content,
      };

      const mockConversation = {
        id: conversationId,
        userId: req.user.id,
        isPublic: false,
      } as Conversation;

      // Mock services
      mockMessageService.findOne.mockResolvedValue(mockMessage);
      mockConversationService.findOne.mockResolvedValue(mockConversation);
      mockMessageService.update.mockResolvedValue(updatedMessage);

      // Act
      const result = await controller.update(req, messageId, updateDto, 'true');

      // Assert
      expectCalledWith(mockMessageService.update, messageId, updateDto, true);
      expect(result).toEqual(updatedMessage);
    });

    it('should throw BadRequestException when user does not own the conversation', async () => {
      // Arrange
      const req = createMockRequest();
      const messageId = 'msg-123';
      const conversationId = 'conv-123';
      const updateDto: UpdateMessageDto = {
        content: 'Updated content',
      };

      const mockMessage = {
        id: messageId,
        content: 'Original content',
        conversationId,
        isFromAi: false,
      } as Message;

      const mockConversation = {
        id: conversationId,
        userId: 'other-user',
        isPublic: false,
      } as Conversation;

      // Mock services
      mockMessageService.findOne.mockResolvedValue(mockMessage);
      mockConversationService.findOne.mockResolvedValue(mockConversation);

      // Act & Assert
      await expect(
        controller.update(req, messageId, updateDto),
      ).rejects.toThrow(BadRequestException);
      expectNotCalled(mockMessageService.update);
    });
  });
});

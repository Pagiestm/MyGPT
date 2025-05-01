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

// Types et interfaces
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    pseudo: string;
  };
  session: Session & Partial<SessionData>;
}

type MockService<T> = Record<keyof T, jest.Mock>;

// Helpers pour les tests
function createMockRequest(userId: string = 'user-123'): RequestWithUser {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      pseudo: 'testuser',
    },
    session: {} as Session & Partial<SessionData>,
  } as RequestWithUser;
}

function createMockMessage(overrides = {}): Partial<Message> {
  return {
    id: 'msg-123',
    content: 'Test message',
    conversationId: 'conv-123',
    isFromAi: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockConversation(overrides = {}): Partial<Conversation> {
  return {
    id: 'conv-123',
    name: 'Test Conversation',
    userId: 'user-123',
    isPublic: false,
    shareLink: null,
    ...overrides,
  };
}

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: MockService<MessageService>;
  let conversationService: MockService<ConversationService>;

  beforeEach(async () => {
    // Crée les services mockés
    messageService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      searchInConversation: jest.fn(),
    } as unknown as MockService<MessageService>;

    conversationService = {
      findOne: jest.fn(),
    } as unknown as MockService<ConversationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        { provide: MessageService, useValue: messageService },
        { provide: ConversationService, useValue: conversationService },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CRUD Operations', () => {
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

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        const expectedMessage = createMockMessage({
          ...createDto,
        });

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.create.mockResolvedValue(expectedMessage);

        // Act
        const result = await controller.create(req, createDto);

        // Assert
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(messageService.create).toHaveBeenCalledWith(createDto);
        expect(result).toEqual(expectedMessage);
      });

      it('should create a message when conversation is public', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';
        const createDto = {
          content: 'Test message',
          conversationId,
          isFromAi: false,
        };

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: true,
        });

        const expectedMessage = createMockMessage(createDto);

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.create.mockResolvedValue(expectedMessage);

        // Act
        const result = await controller.create(req, createDto);

        // Assert
        expect(result).toEqual(expectedMessage);
      });

      it('should throw BadRequestException when user does not have access', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';
        const createDto = {
          content: 'Test message',
          conversationId,
          isFromAi: false,
        };

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: false,
        });

        conversationService.findOne.mockResolvedValue(mockConversation);

        // Act & Assert
        await expect(controller.create(req, createDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(messageService.create).not.toHaveBeenCalled();
      });
    });

    describe('findAll', () => {
      it('should return all messages for a conversation the user owns', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        const mockMessages = [
          createMockMessage({ id: 'msg-1', content: 'Hello' }),
          createMockMessage({
            id: 'msg-2',
            content: 'Hi there',
            isFromAi: true,
          }),
        ];

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.findAll.mockResolvedValue(mockMessages);

        // Act
        const result = await controller.findAll(req, conversationId);

        // Assert
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(messageService.findAll).toHaveBeenCalledWith(conversationId);
        expect(result).toEqual(mockMessages);
      });

      it('should return messages for a public conversation', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: true,
        });

        const mockMessages = [
          createMockMessage({ id: 'msg-1', content: 'Hello' }),
        ];

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.findAll.mockResolvedValue(mockMessages);

        // Act
        const result = await controller.findAll(req, conversationId);

        // Assert
        expect(result).toEqual(mockMessages);
      });

      it('should return messages for a shared conversation', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: false,
          shareLink: 'share-link',
        });

        const mockMessages = [createMockMessage({ id: 'msg-1' })];

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.findAll.mockResolvedValue(mockMessages);

        // Act
        const result = await controller.findAll(req, conversationId);

        // Assert
        expect(result).toEqual(mockMessages);
      });

      it('should throw BadRequestException when user does not have access', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: false,
        });

        conversationService.findOne.mockResolvedValue(mockConversation);

        // Act & Assert
        await expect(controller.findAll(req, conversationId)).rejects.toThrow(
          BadRequestException,
        );
        expect(messageService.findAll).not.toHaveBeenCalled();
      });
    });

    describe('findOne', () => {
      it('should return a message by ID when user has access', async () => {
        // Arrange
        const req = createMockRequest();
        const messageId = 'msg-123';
        const conversationId = 'conv-123';

        const mockMessage = createMockMessage({
          id: messageId,
          conversationId,
        });

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        messageService.findOne.mockResolvedValue(mockMessage);
        conversationService.findOne.mockResolvedValue(mockConversation);

        // Act
        const result = await controller.findOne(req, messageId);

        // Assert
        expect(messageService.findOne).toHaveBeenCalledWith(messageId);
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(result).toEqual(mockMessage);
      });

      it('should throw BadRequestException when user does not have access', async () => {
        // Arrange
        const req = createMockRequest();
        const messageId = 'msg-123';
        const conversationId = 'conv-123';

        const mockMessage = createMockMessage({
          id: messageId,
          conversationId,
        });

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: false,
        });

        messageService.findOne.mockResolvedValue(mockMessage);
        conversationService.findOne.mockResolvedValue(mockConversation);

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

        const mockMessage = createMockMessage({
          id: messageId,
          conversationId,
          content: 'Original content',
        });

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        const updatedMessage = createMockMessage({
          ...mockMessage,
          content: updateDto.content,
        });

        messageService.findOne.mockResolvedValue(mockMessage);
        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.update.mockResolvedValue(updatedMessage);

        // Act
        const result = await controller.update(
          req,
          messageId,
          updateDto,
          'false',
        );

        // Assert
        expect(messageService.findOne).toHaveBeenCalledWith(messageId);
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(messageService.update).toHaveBeenCalledWith(
          messageId,
          updateDto,
          false,
        );
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

        const mockMessage = createMockMessage({
          id: messageId,
          conversationId,
        });

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        const updatedMessage = createMockMessage({
          ...mockMessage,
          content: updateDto.content,
        });

        messageService.findOne.mockResolvedValue(mockMessage);
        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.update.mockResolvedValue(updatedMessage);

        // Act
        const result = await controller.update(
          req,
          messageId,
          updateDto,
          'true',
        );

        // Assert
        expect(messageService.update).toHaveBeenCalledWith(
          messageId,
          updateDto,
          true,
        );
        expect(result).toEqual(updatedMessage);
      });
    });
  });

  describe('Search operations', () => {
    describe('search', () => {
      it('should search messages in a conversation the user owns', async () => {
        // Arrange
        const req = createMockRequest();
        const conversationId = 'conv-123';
        const keyword = 'test';

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: req.user.id,
        });

        const mockMessages = [
          createMockMessage({ id: 'msg-1', content: 'Test message' }),
        ];

        conversationService.findOne.mockResolvedValue(mockConversation);
        messageService.searchInConversation.mockResolvedValue(mockMessages);

        // Act
        const result = await controller.search(req, keyword, conversationId);

        // Assert
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(messageService.searchInConversation).toHaveBeenCalledWith({
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

        const mockConversation = createMockConversation({
          id: conversationId,
          userId: 'other-user',
          isPublic: false,
        });

        conversationService.findOne.mockResolvedValue(mockConversation);

        // Act & Assert
        await expect(
          controller.search(req, keyword, conversationId),
        ).rejects.toThrow(BadRequestException);
        expect(messageService.searchInConversation).not.toHaveBeenCalled();
      });
    });
  });
});

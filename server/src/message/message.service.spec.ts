import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-message.dto';
import { ConversationService } from '../conversation/conversation.service';
import { Conversation } from '../conversation/entities/conversation.entity';
import { IAiAdapter } from '../infrastructure/adapters/GeminiAiAdapter';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Types pour les mocks
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;
type MockQueryBuilder = Record<string, jest.Mock>;

// Mock du QueryBuilder de TypeORM
const createMockQueryBuilder = () => {
  const mockQueryBuilder: MockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };
  return mockQueryBuilder;
};

describe('MessageService', () => {
  let service: MessageService;
  let messagesRepository: MockRepository<Message>;
  let conversationService: jest.Mocked<ConversationService>;
  let aiAdapter: jest.Mocked<IAiAdapter>;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    // Création des mocks
    mockQueryBuilder = createMockQueryBuilder();

    const mockMessagesRepository: MockRepository<Message> = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockConversationService = {
      findOne: jest.fn(),
    };

    const mockAiAdapter = {
      getAiResponse: jest.fn(),
    };

    // Configuration du module de test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessagesRepository,
        },
        {
          provide: 'IAiAdapter',
          useValue: mockAiAdapter,
        },
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    }).compile();

    // Récupération des instances
    service = module.get<MessageService>(MessageService);
    messagesRepository = module.get(getRepositoryToken(Message));
    conversationService = module.get(ConversationService);
    aiAdapter = module.get('IAiAdapter');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user message and generate an AI response', async () => {
      // Arrange
      const conversationId = 'conv-123';
      const createDto: CreateMessageDto = {
        content: 'Hello, AI!',
        conversationId,
        isFromAi: false,
      };

      const userMessage = {
        id: 'msg-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const aiMessage = {
        id: 'msg-2',
        content: 'Hello, human!',
        conversationId,
        isFromAi: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mocks
      conversationService.findOne.mockResolvedValue({
        id: conversationId,
        name: 'Test Conversation',
      } as Conversation);
      messagesRepository.create.mockReturnValueOnce(userMessage);
      messagesRepository.save.mockResolvedValueOnce(userMessage);
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: 'old-1', content: 'previous message', isFromAi: false },
        { id: 'old-2', content: 'previous response', isFromAi: true },
      ]);
      aiAdapter.getAiResponse.mockResolvedValue('Hello, human!');
      messagesRepository.create.mockReturnValueOnce(aiMessage);
      messagesRepository.save.mockResolvedValueOnce(aiMessage);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(conversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(messagesRepository.create).toHaveBeenCalledWith(createDto);
      expect(messagesRepository.save).toHaveBeenCalledWith(userMessage);
      expect(aiAdapter.getAiResponse).toHaveBeenCalledWith(
        'Hello, AI!',
        expect.any(Array),
      );
      expect(messagesRepository.create).toHaveBeenCalledWith({
        content: 'Hello, human!',
        conversationId,
        isFromAi: true,
      });
      expect(messagesRepository.save).toHaveBeenCalledWith(aiMessage);
      expect(result).toEqual(userMessage);
    });

    it('should not generate AI response if message is from AI', async () => {
      // Arrange
      const conversationId = 'conv-123';
      const createDto: CreateMessageDto = {
        content: 'I am an AI message',
        conversationId,
        isFromAi: true,
      };

      const aiMessage = {
        id: 'msg-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mocks
      conversationService.findOne.mockResolvedValue({
        id: conversationId,
        name: 'Test Conversation',
      } as Conversation);
      messagesRepository.create.mockReturnValue(aiMessage);
      messagesRepository.save.mockResolvedValue(aiMessage);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(conversationService.findOne).toHaveBeenCalledWith(conversationId);
      expect(messagesRepository.create).toHaveBeenCalledWith(createDto);
      expect(messagesRepository.save).toHaveBeenCalledWith(aiMessage);
      expect(aiAdapter.getAiResponse).not.toHaveBeenCalled();
      expect(result).toEqual(aiMessage);
    });
  });

  describe('findAll', () => {
    it('should return all messages for a conversation', async () => {
      // Arrange
      const conversationId = 'conv-123';
      const messages = [
        { id: 'msg-1', content: 'Hello', conversationId, isFromAi: false },
        { id: 'msg-2', content: 'Hi there', conversationId, isFromAi: true },
      ];

      messagesRepository.find.mockResolvedValue(messages);

      // Act
      const result = await service.findAll(conversationId);

      // Assert
      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: { conversationId },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });

    it('should return all messages when no conversationId is provided', async () => {
      // Arrange
      const messages = [
        {
          id: 'msg-1',
          content: 'Hello',
          conversationId: 'conv-1',
          isFromAi: false,
        },
        {
          id: 'msg-2',
          content: 'Hi',
          conversationId: 'conv-2',
          isFromAi: true,
        },
      ];

      messagesRepository.find.mockResolvedValue(messages);

      // Act
      const result = await service.findAll();

      // Assert
      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findOne', () => {
    it('should return a message if it exists', async () => {
      // Arrange
      const id = 'msg-123';
      const message = {
        id,
        content: 'Test message',
        conversationId: 'conv-123',
        isFromAi: false,
        conversation: { id: 'conv-123', name: 'Test Conversation' },
      };

      messagesRepository.findOne.mockResolvedValue(message);

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(messagesRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['conversation'],
      });
      expect(result).toEqual(message);
    });

    it('should throw NotFoundException if message does not exist', async () => {
      // Arrange
      const id = 'non-existent';
      messagesRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(messagesRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['conversation'],
      });
    });
  });

  describe('update', () => {
    it('should update a user message', async () => {
      // Arrange
      const id = 'msg-123';
      const updateDto: UpdateMessageDto = { content: 'Updated content' };

      const originalMessage = {
        id,
        content: 'Original content',
        conversationId: 'conv-123',
        isFromAi: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMessage = {
        ...originalMessage,
        content: updateDto.content,
      };

      messagesRepository.findOne.mockResolvedValue(originalMessage);
      messagesRepository.save.mockResolvedValue(updatedMessage);

      // Act
      const result = await service.update(id, updateDto, false);

      // Assert
      expect(messagesRepository.findOne).toHaveBeenCalled();
      expect(messagesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: updateDto.content }),
      );
      expect(result).toEqual(updatedMessage);
    });

    it('should throw BadRequestException if trying to update an AI message', async () => {
      // Arrange
      const id = 'msg-123';
      const updateDto: UpdateMessageDto = { content: 'Updated content' };

      const aiMessage = {
        id,
        content: 'AI response',
        conversationId: 'conv-123',
        isFromAi: true,
      };

      messagesRepository.findOne.mockResolvedValue(aiMessage);

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(messagesRepository.save).not.toHaveBeenCalled();
    });

    it('should regenerate AI response if requested', async () => {
      // Arrange
      const id = 'msg-123';
      const updateDto: UpdateMessageDto = { content: 'Updated question' };

      const userMessage = {
        id,
        content: 'Original question',
        conversationId: 'conv-123',
        isFromAi: false,
        createdAt: new Date(2023, 1, 1),
        updatedAt: new Date(),
      };

      const updatedUserMessage = {
        ...userMessage,
        content: updateDto.content,
      };

      const aiMessage = {
        id: 'msg-124',
        content: 'Original answer',
        conversationId: 'conv-123',
        isFromAi: true,
        createdAt: new Date(2023, 1, 2),
      };

      const updatedAiMessage = {
        ...aiMessage,
        content: 'Updated answer',
      };

      messagesRepository.findOne.mockResolvedValue(userMessage);
      messagesRepository.save.mockResolvedValueOnce(updatedUserMessage);
      mockQueryBuilder.getOne.mockResolvedValue(aiMessage);
      mockQueryBuilder.getMany.mockResolvedValue([{ ...userMessage }]);
      aiAdapter.getAiResponse.mockResolvedValue('Updated answer');
      messagesRepository.save.mockResolvedValueOnce(updatedAiMessage);

      // Act
      const result = await service.update(id, updateDto, true);

      // Assert
      expect(messagesRepository.findOne).toHaveBeenCalled();
      expect(messagesRepository.save).toHaveBeenCalledWith(updatedUserMessage);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(aiAdapter.getAiResponse).toHaveBeenCalledWith(
        updateDto.content,
        expect.any(Array),
      );
      expect(messagesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Updated answer' }),
      );
      expect(result).toEqual(updatedUserMessage);
    });
  });

  describe('remove', () => {
    it('should remove a message', async () => {
      // Arrange
      const id = 'msg-123';
      const message = { id, content: 'To be deleted' };

      messagesRepository.findOne.mockResolvedValue(message);

      // Act
      await service.remove(id);

      // Assert
      expect(messagesRepository.findOne).toHaveBeenCalled();
      expect(messagesRepository.remove).toHaveBeenCalledWith(message);
    });

    it('should throw NotFoundException if message to remove does not exist', async () => {
      // Arrange
      const id = 'non-existent';
      messagesRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(messagesRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('searchInConversation', () => {
    it('should search messages by keyword in a conversation', async () => {
      // Arrange
      const searchDto: SearchMessagesDto = {
        keyword: 'test',
        conversationId: 'conv-123',
      };

      const messages = [
        { id: 'msg-1', content: 'Test message', conversationId: 'conv-123' },
        { id: 'msg-2', content: 'Another test', conversationId: 'conv-123' },
      ];

      messagesRepository.find.mockResolvedValue(messages);

      // Act
      const result = await service.searchInConversation(searchDto);

      // Assert
      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: {
          conversationId: searchDto.conversationId,
          content: expect.any(Object), // ILike est difficile à tester directement
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });
});

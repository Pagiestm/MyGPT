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

// Types et helpers pour les mocks
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;
type MockQueryBuilder = Record<string, jest.Mock>;

// Helper pour créer un QueryBuilder mocké
const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
});

// Helper pour créer un message mocké
function createMockMessage(overrides: Partial<Message> = {}): Partial<Message> {
  return {
    id: 'mock-msg-id',
    content: 'Mock message content',
    conversationId: 'mock-conv-id',
    isFromAi: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper pour créer une conversation mockée
function createMockConversation(
  overrides: Partial<Conversation> = {},
): Partial<Conversation> {
  return {
    id: 'mock-conv-id',
    name: 'Mock Conversation',
    userId: 'mock-user-id',
    ...overrides,
  };
}

describe('MessageService', () => {
  let service: MessageService;
  let messagesRepository: MockRepository<Message>;
  let conversationService: jest.Mocked<ConversationService>;
  let aiAdapter: jest.Mocked<IAiAdapter>;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    // Reset des mocks
    jest.clearAllMocks();

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

  // Tests regroupés par fonctionnalité
  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create a user message and generate an AI response', async () => {
        // Arrange
        const conversationId = 'conv-123';
        const createDto: CreateMessageDto = {
          content: 'Hello, AI!',
          conversationId,
          isFromAi: false,
        };

        const userMessage = createMockMessage({
          id: 'msg-1',
          content: createDto.content,
          conversationId,
          isFromAi: false,
        });

        const aiMessage = createMockMessage({
          id: 'msg-2',
          content: 'Hello, human!',
          conversationId,
          isFromAi: true,
        });

        // Mock setup
        conversationService.findOne.mockResolvedValue(
          createMockConversation({ id: conversationId }) as Conversation,
        );
        messagesRepository.create.mockReturnValueOnce(userMessage as Message);
        messagesRepository.save.mockResolvedValueOnce(userMessage as Message);
        mockQueryBuilder.getMany.mockResolvedValue([
          createMockMessage({ id: 'old-1', content: 'previous message' }),
          createMockMessage({
            id: 'old-2',
            content: 'previous response',
            isFromAi: true,
          }),
        ]);
        aiAdapter.getAiResponse.mockResolvedValue('Hello, human!');
        messagesRepository.create.mockReturnValueOnce(aiMessage as Message);
        messagesRepository.save.mockResolvedValueOnce(aiMessage as Message);

        // Act
        const result = await service.create(createDto);

        // Assert
        expect(conversationService.findOne).toHaveBeenCalledWith(
          conversationId,
        );
        expect(messagesRepository.create).toHaveBeenCalledWith(createDto);
        expect(messagesRepository.save).toHaveBeenCalledWith(userMessage);
        expect(aiAdapter.getAiResponse).toHaveBeenCalled();
        expect(messagesRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Hello, human!',
            conversationId,
            isFromAi: true,
          }),
        );
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

        const aiMessage = createMockMessage({
          id: 'msg-1',
          content: createDto.content,
          conversationId,
          isFromAi: true,
        });

        // Mock setup
        conversationService.findOne.mockResolvedValue(
          createMockConversation({ id: conversationId }) as Conversation,
        );
        messagesRepository.create.mockReturnValue(aiMessage as Message);
        messagesRepository.save.mockResolvedValue(aiMessage as Message);

        // Act
        const result = await service.create(createDto);

        // Assert
        expect(aiAdapter.getAiResponse).not.toHaveBeenCalled();
        expect(result).toEqual(aiMessage);
      });
    });

    describe('findAll', () => {
      it('should return all messages for a conversation', async () => {
        // Arrange
        const conversationId = 'conv-123';
        const messages = [
          createMockMessage({ id: 'msg-1', conversationId }),
          createMockMessage({ id: 'msg-2', conversationId, isFromAi: true }),
        ];

        messagesRepository.find.mockResolvedValue(messages as Message[]);

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
          createMockMessage({ id: 'msg-1', conversationId: 'conv-1' }),
          createMockMessage({
            id: 'msg-2',
            conversationId: 'conv-2',
            isFromAi: true,
          }),
        ];

        messagesRepository.find.mockResolvedValue(messages as Message[]);

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
        const message = createMockMessage({
          id,
          conversation: createMockConversation() as Conversation,
        });

        messagesRepository.findOne.mockResolvedValue(message as Message);

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
        messagesRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('update', () => {
      it('should update a user message', async () => {
        // Arrange
        const id = 'msg-123';
        const updateDto: UpdateMessageDto = { content: 'Updated content' };

        const originalMessage = createMockMessage({
          id,
          content: 'Original content',
        });
        const updatedMessage = createMockMessage({
          ...originalMessage,
          content: updateDto.content,
        });

        messagesRepository.findOne.mockResolvedValue(
          originalMessage as Message,
        );
        messagesRepository.save.mockResolvedValue(updatedMessage as Message);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.update(id, updateDto, false);

        // Assert
        expect(messagesRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ content: updateDto.content }),
        );
        expect(result).toEqual(updatedMessage);
      });

      it('should throw BadRequestException if trying to update an AI message', async () => {
        // Arrange
        const id = 'msg-123';
        const updateDto: UpdateMessageDto = { content: 'Updated content' };
        const aiMessage = createMockMessage({ id, isFromAi: true });

        messagesRepository.findOne.mockResolvedValue(aiMessage as Message);

        // Act & Assert
        await expect(service.update(id, updateDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(messagesRepository.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('AI regeneration', () => {
    it('should regenerate AI response when updating a user message with regenerate=true', async () => {
      // Arrange
      const id = 'msg-123';
      const updateDto: UpdateMessageDto = { content: 'Updated question' };

      const userMessage = createMockMessage({
        id,
        content: 'Original question',
        createdAt: new Date(2023, 1, 1),
      });

      const updatedUserMessage = {
        ...userMessage,
        content: updateDto.content,
      };

      const subsequentMessages = [
        createMockMessage({
          id: 'msg-124',
          content: 'Original answer',
          isFromAi: true,
          createdAt: new Date(2023, 1, 2),
        }),
      ];

      // Mock setup
      messagesRepository.findOne.mockResolvedValue(userMessage as Message);
      messagesRepository.save.mockResolvedValueOnce(
        updatedUserMessage as Message,
      );
      mockQueryBuilder.getMany
        .mockResolvedValueOnce(subsequentMessages as Message[]) // Pour les messages à supprimer
        .mockResolvedValueOnce([userMessage] as Message[]); // Pour l'historique
      aiAdapter.getAiResponse.mockResolvedValue('Updated answer');

      // Act
      const result = await service.update(id, updateDto, true);

      // Assert
      expect(messagesRepository.remove).toHaveBeenCalledWith(
        subsequentMessages,
      );
      expect(aiAdapter.getAiResponse).toHaveBeenCalledWith(
        updateDto.content,
        expect.any(Array),
      );
      expect(messagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Updated answer',
          conversationId: userMessage.conversationId,
          isFromAi: true,
        }),
      );
      expect(result).toEqual(updatedUserMessage);
    });
  });

  describe('Search', () => {
    it('should search messages by keyword in a conversation', async () => {
      // Arrange
      const searchDto: SearchMessagesDto = {
        keyword: 'test',
        conversationId: 'conv-123',
      };

      const messages = [
        createMockMessage({
          id: 'msg-1',
          content: 'Test message',
          conversationId: searchDto.conversationId,
        }),
        createMockMessage({
          id: 'msg-2',
          content: 'Another test',
          conversationId: searchDto.conversationId,
        }),
      ];

      messagesRepository.find.mockResolvedValue(messages as Message[]);

      // Act
      const result = await service.searchInConversation(searchDto);

      // Assert
      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: {
          conversationId: searchDto.conversationId,
          content: expect.any(Object),
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });
});

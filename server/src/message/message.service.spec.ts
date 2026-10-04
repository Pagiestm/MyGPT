import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { SearchMessagesDto } from './dto/search-message.dto';
import { NotFoundException } from '@nestjs/common';
import { Conversation } from '../conversation/entities/conversation.entity';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

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

function createMockConversation(overrides: Partial<Conversation> = {}): Partial<Conversation> {
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockMessagesRepository: MockRepository<Message> = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessagesRepository,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messagesRepository = module.get(getRepositoryToken(Message));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CRUD Operations', () => {
    describe('findAll', () => {
      it('should return all messages for a conversation', async () => {
        const conversationId = 'conv-123';
        const messages = [
          createMockMessage({ id: 'msg-1', conversationId }),
          createMockMessage({ id: 'msg-2', conversationId, isFromAi: true }),
        ];

        messagesRepository.find.mockResolvedValue(messages as Message[]);

        const result = await service.findAll(conversationId);

        expect(messagesRepository.find).toHaveBeenCalledWith({
          where: { conversationId },
          relations: { attachments: true },
          order: { createdAt: 'ASC' },
        });
        expect(result).toEqual(messages);
      });

      it('should return all messages when no conversationId is provided', async () => {
        const messages = [
          createMockMessage({ id: 'msg-1', conversationId: 'conv-1' }),
          createMockMessage({
            id: 'msg-2',
            conversationId: 'conv-2',
            isFromAi: true,
          }),
        ];

        messagesRepository.find.mockResolvedValue(messages as Message[]);

        const result = await service.findAll();

        expect(messagesRepository.find).toHaveBeenCalledWith({
          where: {},
          relations: { attachments: true },
          order: { createdAt: 'ASC' },
        });
        expect(result).toEqual(messages);
      });
    });

    describe('findOne', () => {
      it('should return a message if it exists', async () => {
        const id = 'msg-123';
        const message = createMockMessage({
          id,
          conversation: createMockConversation() as Conversation,
        });

        messagesRepository.findOne.mockResolvedValue(message as Message);

        const result = await service.findOne(id);

        expect(messagesRepository.findOne).toHaveBeenCalledWith({
          where: { id },
          relations: { conversation: true },
        });
        expect(result).toEqual(message);
      });

      it('should throw NotFoundException if message does not exist', async () => {
        messagesRepository.findOne.mockResolvedValue(null);

        await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Search', () => {
    it('should search messages by keyword in a conversation', async () => {
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

      const result = await service.searchInConversation(searchDto);

      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: {
          conversationId: searchDto.conversationId,
          content: expect.any(Object),
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });

    it('searches every conversation of the user, newest first, 20 results at most', async () => {
      messagesRepository.find.mockResolvedValue([]);

      await service.searchForUser('user-1', 'docker');

      expect(messagesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { content: expect.any(Object), conversation: { userId: 'user-1' } },
          order: { createdAt: 'DESC' },
          take: 20,
        }),
      );
    });
  });
});

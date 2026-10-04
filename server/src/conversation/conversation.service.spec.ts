import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SearchConversationDto } from './dto/search-conversation.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

function createMockConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'mock-conv-id',
    name: 'Mock Conversation',
    userId: 'mock-user-id',
    user: { id: 'mock-user-id' },
    messages: [],
    isPublic: false,
    shareLink: null,
    shareExpiresAt: null,
    sharedFrom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Conversation;
}

function createMockMessage(overrides: Partial<any> = {}): any {
  return {
    id: 'mock-msg-id',
    content: 'Mock message content',
    isFromAi: false,
    conversationId: 'mock-conv-id',
    ...overrides,
  };
}

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationsRepository: MockRepository<Conversation>;
  let messagesRepository: MockRepository<Message>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Message),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    conversationsRepository = module.get(getRepositoryToken(Conversation));
    messagesRepository = module.get(getRepositoryToken(Message));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CRUD operations', () => {
    describe('create', () => {
      it('should create a new conversation', async () => {
        const createDto: CreateConversationDto = {
          name: 'Test Conversation',
          userId: 'user-123',
          isPublic: false,
        };
        const expectedConversation = { id: 'conv-123', ...createDto };

        conversationsRepository.create.mockReturnValue(expectedConversation);
        conversationsRepository.save.mockResolvedValue(expectedConversation);

        const result = await service.create(createDto);

        expect(conversationsRepository.create).toHaveBeenCalledWith(createDto);
        expect(conversationsRepository.save).toHaveBeenCalledWith(expectedConversation);
        expect(result).toEqual(expectedConversation);
      });
    });

    describe('findAll & search', () => {
      it('should return all conversations for a user', async () => {
        const userId = 'user-123';
        const expectedConversations = [
          createMockConversation({
            id: 'conv-1',
            name: 'First Conversation',
            userId,
          }),
          createMockConversation({
            id: 'conv-2',
            name: 'Second Conversation',
            userId,
          }),
        ];

        conversationsRepository.find.mockResolvedValue(expectedConversations);

        const result = await service.findAll(userId);

        expect(conversationsRepository.find).toHaveBeenCalledWith({
          where: { userId, archived: false },
          order: { pinned: 'DESC', updatedAt: 'DESC' },
        });
        expect(result).toEqual(expectedConversations);
      });

      it('should list archived conversations separately', async () => {
        conversationsRepository.find.mockResolvedValue([]);

        await service.findAll('user-123', { archived: true });

        expect(conversationsRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({ where: { userId: 'user-123', archived: true } }),
        );
      });

      it('should search conversations by keyword and userId', async () => {
        const searchDto: SearchConversationDto = {
          keyword: 'test',
          userId: 'user-123',
        };
        const expectedResults = [
          createMockConversation({
            id: 'conv-1',
            name: 'Test Conversation',
            userId: 'user-123',
          }),
        ];

        conversationsRepository.find.mockResolvedValue(expectedResults);

        const result = await service.search(searchDto);

        expect(conversationsRepository.find).toHaveBeenCalled();
        expect(result).toEqual(expectedResults);
      });
    });

    describe('findOne', () => {
      it('should return a conversation if it exists', async () => {
        const id = 'conv-123';
        const expectedConversation = createMockConversation({
          id,
          name: 'Test Conversation',
          userId: 'user-123',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            pseudo: 'tester',
            password: '',
            conversations: [],
            created_at: undefined,
          },
        });

        conversationsRepository.findOne.mockResolvedValue(expectedConversation);

        const result = await service.findOne(id);

        expect(conversationsRepository.findOne).toHaveBeenCalledWith({
          where: { id },
          relations: { messages: true, user: true },
        });
        expect(result).toEqual(expectedConversation);
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('update', () => {
      it('should update and return a conversation', async () => {
        const id = 'conv-123';
        const updateDto: UpdateConversationDto = { name: 'Updated Name' };
        const existingConversation = createMockConversation({
          id,
          name: 'Original Name',
          userId: 'user-123',
        });
        const expectedUpdatedConversation = {
          ...existingConversation,
          ...updateDto,
        };

        conversationsRepository.findOne.mockResolvedValue(existingConversation);
        conversationsRepository.save.mockResolvedValue(expectedUpdatedConversation);

        const result = await service.update(id, updateDto);

        expect(conversationsRepository.save).toHaveBeenCalledWith(
          expect.objectContaining(updateDto),
        );
        expect(result).toEqual(expectedUpdatedConversation);
      });

      it('should lock the title once the user renames the conversation', async () => {
        conversationsRepository.findOne.mockResolvedValue(createMockConversation());
        conversationsRepository.save.mockImplementation((value: Conversation) =>
          Promise.resolve(value),
        );

        const result = await service.update('conv-123', { name: 'Mon titre' });

        expect(result.titleLocked).toBe(true);
      });

      it('should not lock the title when only pinning or archiving', async () => {
        conversationsRepository.findOne.mockResolvedValue(
          createMockConversation({ titleLocked: false }),
        );
        conversationsRepository.save.mockImplementation((value: Conversation) =>
          Promise.resolve(value),
        );

        const result = await service.update('conv-123', { pinned: true, archived: true });

        expect(result).toMatchObject({ pinned: true, archived: true, titleLocked: false });
      });

      it('should throw NotFoundException if conversation to update does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.update('non-existent-id', { name: 'New Name' })).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('remove', () => {
      it('should remove a conversation', async () => {
        const conversationToRemove = createMockConversation({
          id: 'conv-123',
          name: 'To be deleted',
        });
        conversationsRepository.findOne.mockResolvedValue(conversationToRemove);

        await service.remove('conv-123');

        expect(conversationsRepository.remove).toHaveBeenCalledWith(conversationToRemove);
      });

      it('should throw NotFoundException if conversation to remove does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Sharing features', () => {
    describe('findByShareLink', () => {
      it('should return a shared conversation if valid', async () => {
        const shareLink = 'abc123';
        const future = new Date();
        future.setDate(future.getDate() + 1);

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          shareLink,
          shareExpiresAt: future,
        });

        conversationsRepository.findOne.mockResolvedValue(sharedConversation);

        const result = await service.findByShareLink(shareLink);

        expect(result).toEqual(sharedConversation);
      });

      it('should throw NotFoundException if shared conversation does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.findByShareLink('invalid-link')).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException if shared link is expired', async () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);

        const expiredConversation = createMockConversation({
          shareLink: 'expired-link',
          shareExpiresAt: past,
        });

        conversationsRepository.findOne.mockResolvedValue(expiredConversation);

        await expect(service.findByShareLink('expired-link')).rejects.toThrow(BadRequestException);
      });
    });

    describe('shareConversation', () => {
      it('should generate a share link for a conversation', async () => {
        const shareDto: ShareConversationDto = {
          expiresAt: '2025-01-01T00:00:00.000Z',
        };
        const conversation = createMockConversation({
          id: 'conv-123',
          shareLink: null,
          shareExpiresAt: null,
        });

        conversationsRepository.findOne.mockResolvedValue(conversation);

        conversationsRepository.save.mockImplementation((conv) => {
          expect(conv.shareLink).toBeTruthy();
          expect(conv.shareExpiresAt).toEqual(new Date(shareDto.expiresAt));

          return Promise.resolve(conv);
        });

        const result = await service.shareConversation('conv-123', shareDto);

        expect(result.shareLink).toBeTruthy();

        if ('shareExpiresAt' in result) {
          expect(result.shareExpiresAt).toEqual(new Date(shareDto.expiresAt));
        } else {
          expect(conversationsRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              shareExpiresAt: new Date(shareDto.expiresAt),
            }),
          );
        }
      });

      it('should keep existing share link if already present', async () => {
        const existingShareLink = 'existing-link';
        const conversation = createMockConversation({
          id: 'conv-123',
          shareLink: existingShareLink,
        });

        conversationsRepository.findOne.mockResolvedValue(conversation);
        conversationsRepository.save.mockImplementation((conv) => Promise.resolve(conv));

        const result = await service.shareConversation('conv-123', {});

        expect(result.shareLink).toBe(existingShareLink);
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.shareConversation('non-existent-id', {})).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('revokeShare', () => {
      it('should revoke share for a conversation', async () => {
        const conversation = createMockConversation({
          id: 'conv-123',
          shareLink: 'share-link',
          shareExpiresAt: new Date(),
        });

        conversationsRepository.findOne.mockResolvedValue(conversation);
        conversationsRepository.save.mockImplementation((conv) => Promise.resolve(conv));

        await service.revokeShare('conv-123');

        expect(conversation.shareLink).toBeNull();
        expect(conversation.shareExpiresAt).toBeNull();
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        conversationsRepository.findOne.mockResolvedValue(null);

        await expect(service.revokeShare('non-existent-id')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Saved conversations', () => {
    describe('saveSharedConversation', () => {
      it('should save a shared conversation for a user', async () => {
        const userId = 'user-456';
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'conv-123',
          newName: 'My Saved Conversation',
        };

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          name: 'Original Conversation',
          userId: 'user-123',
          shareLink: 'share-link-123',
          shareExpiresAt: new Date('2025-01-01'),
          messages: [
            createMockMessage({
              id: 'msg-1',
              content: 'Hello',
              conversationId: 'conv-123',
            }),
            createMockMessage({
              id: 'msg-2',
              content: 'Hi there',
              isFromAi: true,
              conversationId: 'conv-123',
            }),
          ],
        });

        const newConversation = createMockConversation({
          id: 'new-conv-456',
          name: saveDto.newName,
          userId,
          sharedFrom: sharedConversation.id,
        });

        // Conversation finale avec messages copiés
        const expectedSavedConversation = createMockConversation({
          ...newConversation,
          messages: [
            createMockMessage({
              id: 'new-msg-1',
              content: 'Hello',
              conversationId: 'new-conv-456',
            }),
            createMockMessage({
              id: 'new-msg-2',
              content: 'Hi there',
              isFromAi: true,
              conversationId: 'new-conv-456',
            }),
          ],
        });

        jest.spyOn(service, 'findByShareLink').mockResolvedValue(sharedConversation);
        conversationsRepository.create.mockReturnValue(newConversation);
        conversationsRepository.save.mockResolvedValue(newConversation);
        messagesRepository.create.mockImplementation(
          (msgData: Partial<Message>) => msgData as Message,
        );
        messagesRepository.save.mockImplementation((msgData) => Promise.resolve(msgData));
        jest.spyOn(service, 'findOne').mockResolvedValue(expectedSavedConversation);

        const result = await service.saveSharedConversation(userId, saveDto);

        expect(service.findByShareLink).toHaveBeenCalledWith(saveDto.shareLink);
        expect(conversationsRepository.create).toHaveBeenCalledWith({
          name: saveDto.newName,
          userId,
          sharedFrom: sharedConversation.id,
        });
        expect(result).toEqual(expectedSavedConversation);
      });

      it('should use default name if newName is not provided', async () => {
        const userId = 'user-456';
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'conv-123',
        };

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          name: 'Original Conversation',
          shareLink: 'share-link-123',
        });

        const newConversation = createMockConversation({
          id: 'new-conv-456',
          name: 'Original Conversation (Copie)',
          userId,
          sharedFrom: sharedConversation.id,
        });

        jest.spyOn(service, 'findByShareLink').mockResolvedValue(sharedConversation);
        conversationsRepository.create.mockReturnValue(newConversation);
        conversationsRepository.save.mockResolvedValue(newConversation);
        jest.spyOn(service, 'findOne').mockResolvedValue(newConversation);

        const result = await service.saveSharedConversation(userId, saveDto);

        expect(conversationsRepository.create).toHaveBeenCalledWith({
          name: `${sharedConversation.name} (Copie)`,
          userId,
          sharedFrom: sharedConversation.id,
        });
        expect(result).toEqual(newConversation);
      });

      it('should throw BadRequestException if conversationId does not match', async () => {
        const userId = 'user-456';
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'wrong-conv-id',
        };

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          shareLink: 'share-link-123',
        });

        jest.spyOn(service, 'findByShareLink').mockResolvedValue(sharedConversation);

        await expect(service.saveSharedConversation(userId, saveDto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw NotFoundException if shared conversation not found', async () => {
        jest
          .spyOn(service, 'findByShareLink')
          .mockRejectedValue(new NotFoundException('Shared conversation not found'));

        await expect(
          service.saveSharedConversation('user-id', {
            shareLink: 'invalid-link',
            conversationId: 'conv-id',
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findSavedByUser', () => {
      it('should return all saved conversations for a user', async () => {
        const userId = 'user-123';
        const savedConversations = [
          createMockConversation({
            id: 'conv-1',
            sharedFrom: 'original-1',
            userId,
          }),
          createMockConversation({
            id: 'conv-2',
            sharedFrom: 'original-2',
            userId,
          }),
        ];

        conversationsRepository.find.mockResolvedValue(savedConversations);

        const result = await service.findSavedByUser(userId);

        expect(conversationsRepository.find).toHaveBeenCalledWith({
          where: {
            userId: userId,
            sharedFrom: Not(IsNull()),
          },
          order: { createdAt: 'DESC' },
          relations: { messages: true },
        });
        expect(result).toEqual(savedConversations);
      });

      it('should return empty array if user has no saved conversations', async () => {
        conversationsRepository.find.mockResolvedValue([]);

        const result = await service.findSavedByUser('user-no-saves');

        expect(result).toEqual([]);
      });
    });
  });
});

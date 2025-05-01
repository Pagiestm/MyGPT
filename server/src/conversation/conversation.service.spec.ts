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

// Type pour les repositories mockés
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// Fonction helper pour créer des repositories mockés
const createMockRepository = <T>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

// Fonction helper pour créer des objets Conversation mockés
function createMockConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
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

// Fonction helper pour créer des messages mockés
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
    // Configuration du module de test
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

    // Réinitialiser les mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Groupe de tests pour les opérations CRUD
  describe('CRUD operations', () => {
    // Tests pour create
    describe('create', () => {
      it('should create a new conversation', async () => {
        // Arrange
        const createDto: CreateConversationDto = {
          name: 'Test Conversation',
          userId: 'user-123',
          isPublic: false,
        };
        const expectedConversation = { id: 'conv-123', ...createDto };

        conversationsRepository.create.mockReturnValue(expectedConversation);
        conversationsRepository.save.mockResolvedValue(expectedConversation);

        // Act
        const result = await service.create(createDto);

        // Assert
        expect(conversationsRepository.create).toHaveBeenCalledWith(createDto);
        expect(conversationsRepository.save).toHaveBeenCalledWith(
          expectedConversation,
        );
        expect(result).toEqual(expectedConversation);
      });
    });

    // Tests pour findAll et search
    describe('findAll & search', () => {
      it('should return all conversations for a user', async () => {
        // Arrange
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

        // Act
        const result = await service.findAll(userId);

        // Assert
        expect(conversationsRepository.find).toHaveBeenCalledWith({
          where: { userId },
          order: { updatedAt: 'DESC' },
        });
        expect(result).toEqual(expectedConversations);
      });

      it('should search conversations by keyword and userId', async () => {
        // Arrange
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

        // Act
        const result = await service.search(searchDto);

        // Assert
        expect(conversationsRepository.find).toHaveBeenCalled();
        expect(result).toEqual(expectedResults);
      });
    });

    // Tests pour findOne
    describe('findOne', () => {
      it('should return a conversation if it exists', async () => {
        // Arrange
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

        // Act
        const result = await service.findOne(id);

        // Assert
        expect(conversationsRepository.findOne).toHaveBeenCalledWith({
          where: { id },
          relations: ['messages', 'user'],
        });
        expect(result).toEqual(expectedConversation);
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    // Tests pour update
    describe('update', () => {
      it('should update and return a conversation', async () => {
        // Arrange
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
        conversationsRepository.save.mockResolvedValue(
          expectedUpdatedConversation,
        );

        // Act
        const result = await service.update(id, updateDto);

        // Assert
        expect(conversationsRepository.save).toHaveBeenCalledWith(
          expect.objectContaining(updateDto),
        );
        expect(result).toEqual(expectedUpdatedConversation);
      });

      it('should throw NotFoundException if conversation to update does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.update('non-existent-id', { name: 'New Name' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    // Tests pour remove
    describe('remove', () => {
      it('should remove a conversation', async () => {
        // Arrange
        const conversationToRemove = createMockConversation({
          id: 'conv-123',
          name: 'To be deleted',
        });
        conversationsRepository.findOne.mockResolvedValue(conversationToRemove);

        // Act
        await service.remove('conv-123');

        // Assert
        expect(conversationsRepository.remove).toHaveBeenCalledWith(
          conversationToRemove,
        );
      });

      it('should throw NotFoundException if conversation to remove does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.remove('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // Groupe de tests pour les fonctionnalités de partage
  describe('Sharing features', () => {
    // Tests pour findByShareLink
    describe('findByShareLink', () => {
      it('should return a shared conversation if valid', async () => {
        // Arrange
        const shareLink = 'abc123';
        const future = new Date();
        future.setDate(future.getDate() + 1);

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          shareLink,
          shareExpiresAt: future,
        });

        conversationsRepository.findOne.mockResolvedValue(sharedConversation);

        // Act
        const result = await service.findByShareLink(shareLink);

        // Assert
        expect(result).toEqual(sharedConversation);
      });

      it('should throw NotFoundException if shared conversation does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findByShareLink('invalid-link')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw BadRequestException if shared link is expired', async () => {
        // Arrange
        const past = new Date();
        past.setDate(past.getDate() - 1);

        const expiredConversation = createMockConversation({
          shareLink: 'expired-link',
          shareExpiresAt: past,
        });

        conversationsRepository.findOne.mockResolvedValue(expiredConversation);

        // Act & Assert
        await expect(service.findByShareLink('expired-link')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    // Tests pour shareConversation
    describe('shareConversation', () => {
      it('should generate a share link for a conversation', async () => {
        // Arrange
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

        // Act
        const result = await service.shareConversation('conv-123', shareDto);

        // Assert
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
        // Arrange
        const existingShareLink = 'existing-link';
        const conversation = createMockConversation({
          id: 'conv-123',
          shareLink: existingShareLink,
        });

        conversationsRepository.findOne.mockResolvedValue(conversation);
        conversationsRepository.save.mockImplementation((conv) =>
          Promise.resolve(conv),
        );

        // Act
        const result = await service.shareConversation('conv-123', {});

        // Assert
        expect(result.shareLink).toBe(existingShareLink);
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.shareConversation('non-existent-id', {}),
        ).rejects.toThrow(NotFoundException);
      });
    });

    // Tests pour revokeShare
    describe('revokeShare', () => {
      it('should revoke share for a conversation', async () => {
        // Arrange
        const conversation = createMockConversation({
          id: 'conv-123',
          shareLink: 'share-link',
          shareExpiresAt: new Date(),
        });

        conversationsRepository.findOne.mockResolvedValue(conversation);
        conversationsRepository.save.mockImplementation((conv) =>
          Promise.resolve(conv),
        );

        // Act
        await service.revokeShare('conv-123');

        // Assert
        expect(conversation.shareLink).toBeNull();
        expect(conversation.shareExpiresAt).toBeNull();
      });

      it('should throw NotFoundException if conversation does not exist', async () => {
        // Arrange
        conversationsRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.revokeShare('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  // Groupe de tests pour les conversations sauvegardées
  describe('Saved conversations', () => {
    // Tests pour saveSharedConversation
    describe('saveSharedConversation', () => {
      it('should save a shared conversation for a user', async () => {
        // Arrange
        const userId = 'user-456';
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'conv-123',
          newName: 'My Saved Conversation',
        };

        // Conversation partagée d'origine
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

        // Nouvelle conversation créée
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

        // Mocks
        jest
          .spyOn(service, 'findByShareLink')
          .mockResolvedValue(sharedConversation);
        conversationsRepository.create.mockReturnValue(newConversation);
        conversationsRepository.save.mockResolvedValue(newConversation);
        messagesRepository.create.mockImplementation(
          (msgData: Partial<Message>) => msgData as Message,
        );
        messagesRepository.save.mockImplementation((msgData) =>
          Promise.resolve(msgData),
        );
        jest
          .spyOn(service, 'findOne')
          .mockResolvedValue(expectedSavedConversation);

        // Act
        const result = await service.saveSharedConversation(userId, saveDto);

        // Assert
        expect(service.findByShareLink).toHaveBeenCalledWith(saveDto.shareLink);
        expect(conversationsRepository.create).toHaveBeenCalledWith({
          name: saveDto.newName,
          userId,
          sharedFrom: sharedConversation.id,
        });
        expect(result).toEqual(expectedSavedConversation);
      });

      it('should use default name if newName is not provided', async () => {
        // Arrange
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

        // Mocks
        jest
          .spyOn(service, 'findByShareLink')
          .mockResolvedValue(sharedConversation);
        conversationsRepository.create.mockReturnValue(newConversation);
        conversationsRepository.save.mockResolvedValue(newConversation);
        jest.spyOn(service, 'findOne').mockResolvedValue(newConversation);

        // Act
        const result = await service.saveSharedConversation(userId, saveDto);

        // Assert
        expect(conversationsRepository.create).toHaveBeenCalledWith({
          name: `${sharedConversation.name} (Copie)`,
          userId,
          sharedFrom: sharedConversation.id,
        });
        expect(result).toEqual(newConversation);
      });

      it('should throw BadRequestException if conversationId does not match', async () => {
        // Arrange
        const userId = 'user-456';
        const saveDto = {
          shareLink: 'share-link-123',
          conversationId: 'wrong-conv-id',
        };

        const sharedConversation = createMockConversation({
          id: 'conv-123',
          shareLink: 'share-link-123',
        });

        jest
          .spyOn(service, 'findByShareLink')
          .mockResolvedValue(sharedConversation);

        // Act & Assert
        await expect(
          service.saveSharedConversation(userId, saveDto),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException if shared conversation not found', async () => {
        // Arrange
        jest
          .spyOn(service, 'findByShareLink')
          .mockRejectedValue(
            new NotFoundException('Shared conversation not found'),
          );

        // Act & Assert
        await expect(
          service.saveSharedConversation('user-id', {
            shareLink: 'invalid-link',
            conversationId: 'conv-id',
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    // Tests pour findSavedByUser
    describe('findSavedByUser', () => {
      it('should return all saved conversations for a user', async () => {
        // Arrange
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

        // Act
        const result = await service.findSavedByUser(userId);

        // Assert
        expect(conversationsRepository.find).toHaveBeenCalledWith({
          where: {
            userId: userId,
            sharedFrom: Not(IsNull()),
          },
          order: { createdAt: 'DESC' },
          relations: ['messages'],
        });
        expect(result).toEqual(savedConversations);
      });

      it('should return empty array if user has no saved conversations', async () => {
        // Arrange
        conversationsRepository.find.mockResolvedValue([]);

        // Act
        const result = await service.findSavedByUser('user-no-saves');

        // Assert
        expect(result).toEqual([]);
      });
    });
  });
});

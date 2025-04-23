import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SearchConversationDto } from './dto/search-conversation.dto';

// Créer des types pour les repository mockés
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// Factory pour créer des repositories mockés
const createMockRepository = <T>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationsRepository: MockRepository<Conversation>;

  beforeEach(async () => {
    // Configuration du module de test avec des dépendances mockées
    const module: TestingModule = await Test.createTestingModule({
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
  });

  // Test de base - le service doit être défini
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test pour la méthode create
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

  // Test pour la méthode findAll
  describe('findAll', () => {
    it('should return all conversations for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedConversations = [
        { id: 'conv-1', name: 'First Conversation', userId },
        { id: 'conv-2', name: 'Second Conversation', userId },
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

    it('should return all conversations when no userId is provided', async () => {
      // Arrange
      const expectedConversations = [
        { id: 'conv-1', name: 'First Conversation', userId: 'user-1' },
        { id: 'conv-2', name: 'Second Conversation', userId: 'user-2' },
      ];

      conversationsRepository.find.mockResolvedValue(expectedConversations);

      // Act
      const result = await service.findAll();

      // Assert
      expect(conversationsRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { updatedAt: 'DESC' },
      });
      expect(result).toEqual(expectedConversations);
    });
  });

  // Test pour la méthode findOne
  describe('findOne', () => {
    it('should return a conversation if it exists', async () => {
      // Arrange
      const id = 'conv-123';
      const expectedConversation = {
        id,
        name: 'Test Conversation',
        userId: 'user-123',
        messages: [],
        user: { id: 'user-123', email: 'test@example.com', pseudo: 'tester' },
      };

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
      const id = 'non-existent-id';
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages', 'user'],
      });
    });
  });

  // Test pour la méthode findByShareLink
  describe('findByShareLink', () => {
    it('should return a shared conversation if it exists and is not expired', async () => {
      // Arrange
      const shareLink = 'abc123';
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const expectedConversation = {
        id: 'conv-123',
        name: 'Shared Conversation',
        userId: 'user-123',
        shareLink,
        shareExpiresAt: future,
        messages: [],
        user: { id: 'user-123' },
      };

      conversationsRepository.findOne.mockResolvedValue(expectedConversation);

      // Act
      const result = await service.findByShareLink(shareLink);

      // Assert
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { shareLink },
        relations: ['messages', 'user'],
      });
      expect(result).toEqual(expectedConversation);
    });

    it('should throw NotFoundException if shared conversation does not exist', async () => {
      // Arrange
      const shareLink = 'invalid-link';
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByShareLink(shareLink)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if shared link is expired', async () => {
      // Arrange
      const shareLink = 'expired-link';
      const past = new Date();
      past.setDate(past.getDate() - 1);

      const expiredConversation = {
        id: 'conv-123',
        shareLink,
        shareExpiresAt: past,
      };

      conversationsRepository.findOne.mockResolvedValue(expiredConversation);

      // Act & Assert
      await expect(service.findByShareLink(shareLink)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // Test pour la méthode update
  describe('update', () => {
    it('should update and return a conversation', async () => {
      // Arrange
      const id = 'conv-123';
      const updateDto: UpdateConversationDto = { name: 'Updated Name' };
      const existingConversation = {
        id,
        name: 'Original Name',
        userId: 'user-123',
      };
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
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages', 'user'],
      });
      expect(conversationsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
      expect(result).toEqual(expectedUpdatedConversation);
    });

    it('should throw NotFoundException if conversation to update does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      const updateDto: UpdateConversationDto = { name: 'Updated Name' };
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Test pour la méthode remove
  describe('remove', () => {
    it('should remove a conversation', async () => {
      // Arrange
      const id = 'conv-123';
      const conversationToRemove = { id, name: 'To be deleted' };

      conversationsRepository.findOne.mockResolvedValue(conversationToRemove);

      // Act
      await service.remove(id);

      // Assert
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages', 'user'],
      });
      expect(conversationsRepository.remove).toHaveBeenCalledWith(
        conversationToRemove,
      );
    });

    it('should throw NotFoundException if conversation to remove does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  // Test pour la méthode search
  describe('search', () => {
    it('should search conversations by keyword and userId', async () => {
      // Arrange
      const searchDto: SearchConversationDto = {
        keyword: 'test',
        userId: 'user-123',
      };
      const expectedResults = [
        { id: 'conv-1', name: 'Test Conversation', userId: 'user-123' },
      ];

      conversationsRepository.find.mockResolvedValue(expectedResults);

      // Act
      const result = await service.search(searchDto);

      // Assert
      expect(conversationsRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedResults);
    });

    it('should search all conversations when no userId is provided', async () => {
      // Arrange
      const searchDto: SearchConversationDto = {
        keyword: 'test',
      };
      const expectedResults = [
        { id: 'conv-1', name: 'Test Conversation', userId: 'user-1' },
        { id: 'conv-2', name: 'Testing Conversation', userId: 'user-2' },
      ];

      conversationsRepository.find.mockResolvedValue(expectedResults);

      // Act
      const result = await service.search(searchDto);

      // Assert
      expect(conversationsRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedResults);
    });
  });

  // Test pour la méthode shareConversation
  describe('shareConversation', () => {
    it('should generate a share link for a conversation', async () => {
      // Arrange
      const id = 'conv-123';
      const shareDto: ShareConversationDto = {
        expiresAt: '2025-01-01T00:00:00.000Z',
      };
      const conversation = {
        id,
        name: 'Conversation to Share',
        userId: 'user-123',
        shareLink: null,
        shareExpiresAt: null,
      };

      conversationsRepository.findOne.mockResolvedValue(conversation);
      conversationsRepository.save.mockImplementation((conv) =>
        Promise.resolve(conv),
      );

      // Act
      const result = await service.shareConversation(id, shareDto);

      // Assert
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages', 'user'],
      });
      expect(conversationsRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('shareLink');
      expect(conversation.shareLink).toBeTruthy();
      expect(conversation.shareExpiresAt).toEqual(new Date(shareDto.expiresAt));
    });

    it('should keep existing share link if already present', async () => {
      // Arrange
      const id = 'conv-123';
      const existingShareLink = 'existing-link';
      const shareDto: ShareConversationDto = {};
      const conversation = {
        id,
        name: 'Already Shared Conversation',
        userId: 'user-123',
        shareLink: existingShareLink,
        shareExpiresAt: null,
      };

      conversationsRepository.findOne.mockResolvedValue(conversation);
      conversationsRepository.save.mockImplementation((conv) =>
        Promise.resolve(conv),
      );

      // Act
      const result = await service.shareConversation(id, shareDto);

      // Assert
      expect(result.shareLink).toBe(existingShareLink);
      expect(conversation.shareLink).toBe(existingShareLink);
    });

    it('should throw NotFoundException if conversation to share does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      const shareDto: ShareConversationDto = {};
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.shareConversation(id, shareDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Test pour la méthode revokeShare
  describe('revokeShare', () => {
    it('should revoke share for a conversation', async () => {
      // Arrange
      const id = 'conv-123';
      const conversation = {
        id,
        name: 'Shared Conversation',
        userId: 'user-123',
        shareLink: 'share-link',
        shareExpiresAt: new Date(),
      };

      conversationsRepository.findOne.mockResolvedValue(conversation);
      conversationsRepository.save.mockImplementation((conv) =>
        Promise.resolve(conv),
      );

      // Act
      await service.revokeShare(id);

      // Assert
      expect(conversationsRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages', 'user'],
      });
      expect(conversationsRepository.save).toHaveBeenCalled();
      expect(conversation.shareLink).toBeNull();
      expect(conversation.shareExpiresAt).toBeNull();
    });

    it('should throw NotFoundException if conversation to revoke share does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      conversationsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.revokeShare(id)).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

// Mock de bcrypt
jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockRepository: Partial<Repository<User>>;

  // Données de test
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    pseudo: 'testuser',
    password: 'hashedPassword',
    created_at: new Date(),
    conversations: [],
  };

  const mockCreateUserDto: CreateUserDto = {
    email: 'new@example.com',
    pseudo: 'newuser',
    password: 'StrongP@ss123',
  };

  beforeEach(async () => {
    // Création d'un mock repository avec typage explicite
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mock de bcrypt.hash
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a user if id exists', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('register', () => {
    it('should successfully create a new user', async () => {
      // Mock des vérifications d'email et pseudo uniques
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock de la création d'utilisateur
      (mockRepository.create as jest.Mock).mockReturnValue({
        ...mockCreateUserDto,
        password: 'hashedPassword',
      });

      (mockRepository.save as jest.Mock).mockResolvedValue({
        id: '2',
        ...mockCreateUserDto,
        password: 'hashedPassword',
        created_at: new Date(),
      });

      const result = await service.register(mockCreateUserDto);

      expect(result).toEqual({ message: 'Inscription réussie!' });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: mockCreateUserDto.email,
        pseudo: mockCreateUserDto.pseudo,
        password: 'hashedPassword',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if pseudo already exists', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updatePseudo', () => {
    it('should update user pseudo successfully', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      const updatedUser = {
        ...mockUser,
        pseudo: 'newpseudo',
      };
      (mockRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updatePseudo('1', 'newpseudo');

      expect(result).toEqual({
        message: 'Pseudo modifié avec succès!',
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { pseudo: 'newpseudo' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        pseudo: 'newpseudo',
      });
    });

    it('should not check uniqueness if new pseudo is same as current', async () => {
      // Mock pour trouver l'utilisateur
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock pour la sauvegarde
      (mockRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.updatePseudo('1', mockUser.pseudo);

      expect(result).toEqual({
        message: 'Aucune modification nécessaire, même pseudo.',
      });
      // Vérifie qu'on a appelé findOne une seule fois (pour trouver l'utilisateur)
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      mockRepository.remove = jest.fn();

      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should delete user account successfully', async () => {
      // Mock pour trouver l'utilisateur
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock pour la suppression réussie
      (mockRepository.remove as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.deleteAccount('1');

      expect(result).toEqual({
        message: 'Compte utilisateur supprimé avec succès',
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.deleteAccount('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if deletion fails', async () => {
      // Mock pour trouver l'utilisateur
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock pour simuler une erreur lors de la suppression
      (mockRepository.remove as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.deleteAccount('1')).rejects.toThrow(
        'Une erreur est survenue lors de la suppression du compte',
      );
    });
  });
});

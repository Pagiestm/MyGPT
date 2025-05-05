import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePseudoDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  // Mock repository pour le UserService
  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        pseudo: 'testuser',
        password: 'StrongP@ss123',
      };

      const expectedResult = {
        message: 'Inscription réussie!',
      };

      jest.spyOn(service, 'register').mockResolvedValue(expectedResult);

      expect(await controller.register(createUserDto)).toBe(expectedResult);
    });
  });

  describe('updatePseudo', () => {
    it('should update user pseudo', async () => {
      // Mock du Request avec l'utilisateur connecté
      const req = {
        user: { id: '1', email: 'test@example.com', pseudo: 'oldpseudo' },
      };

      const updatePseudoDto: UpdatePseudoDto = { pseudo: 'newpseudo' };

      const expectedResult = {
        message: 'Pseudo mis à jour avec succès',
        pseudo: 'newpseudo',
      };

      jest.spyOn(service, 'updatePseudo').mockResolvedValue(expectedResult);

      expect(await controller.updatePseudo(req as any, updatePseudoDto)).toBe(
        expectedResult,
      );
      expect(service.updatePseudo).toHaveBeenCalledWith('1', 'newpseudo');
    });

    it('should pass through errors from the service', async () => {
      const req = {
        user: { id: '1' },
      };

      const updatePseudoDto: UpdatePseudoDto = { pseudo: 'takenPseudo' };

      jest
        .spyOn(service, 'updatePseudo')
        .mockRejectedValue(new NotFoundException('Utilisateur non trouvé'));

      await expect(
        controller.updatePseudo(req as any, updatePseudoDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account and destroy session', async () => {
      const req = {
        user: { id: '1' },
        session: {
          destroy: jest.fn((callback?: (err?: Error) => void) => {
            if (callback) callback();
            return true;
          }),
        },
      };

      const expectedResult = {
        message: 'Compte utilisateur supprimé avec succès',
      };

      jest.spyOn(service, 'deleteAccount').mockResolvedValue(expectedResult);

      const result = (await controller.deleteAccount(req as any)) as {
        message: string;
      };

      expect(result).toEqual(expectedResult);
      expect(service.deleteAccount).toHaveBeenCalledWith('1');
      expect(req.session.destroy).toHaveBeenCalled();
    });

    it('should handle errors when deleting account', async () => {
      const req = {
        user: { id: '1' },
        session: {
          destroy: jest.fn(),
        },
      };

      jest
        .spyOn(service, 'deleteAccount')
        .mockRejectedValue(
          new InternalServerErrorException('Erreur lors de la suppression'),
        );

      await expect(controller.deleteAccount(req as any)).rejects.toThrow(
        InternalServerErrorException,
      );
      // Vérifier que la session n'est pas détruite en cas d'erreur
      expect(req.session.destroy).not.toHaveBeenCalled();
    });
  });
});

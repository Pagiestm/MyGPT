import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(
        `Aucun utilisateur trouvé avec l'email ${email}`,
      );
    }

    return user;
  }

  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const existingUserByEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const existingUserByPseudo = await this.usersRepository.findOne({
      where: { pseudo: createUserDto.pseudo },
    });

    if (existingUserByPseudo) {
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const user = this.usersRepository.create({
        email: createUserDto.email,
        pseudo: createUserDto.pseudo,
        password: hashedPassword,
      });

      await this.usersRepository.save(user);

      return {
        message: 'Inscription réussie!',
      };
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de l'inscription",
      );
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  async updatePseudo(
    userId: string,
    newPseudo: string,
  ): Promise<{ message: string }> {
    const user = await this.findOne(userId);

    if (newPseudo === user.pseudo) {
      return { message: 'Aucune modification nécessaire, même pseudo.' };
    }

    const existingUserByPseudo = await this.usersRepository.findOne({
      where: { pseudo: newPseudo },
    });

    if (existingUserByPseudo) {
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }

    try {
      user.pseudo = newPseudo;
      await this.usersRepository.save(user);

      return {
        message: 'Pseudo modifié avec succès!',
      };
    } catch (error) {
      console.error('Erreur lors de la modification du pseudo:', error);
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la modification du pseudo',
      );
    }
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    // Vérifier si l'utilisateur existe
    const user = await this.findOne(userId);

    try {
      // Supprimer l'utilisateur (les conversations et messages seront supprimés en cascade)
      await this.usersRepository.remove(user);

      return {
        message: 'Compte utilisateur supprimé avec succès',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la suppression du compte',
      );
    }
  }
}

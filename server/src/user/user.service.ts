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
    // Vérifie si l'email est déjà utilisé
    const existingUserByEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Vérifie si le pseudo est déjà utilisé
    const existingUserByPseudo = await this.usersRepository.findOne({
      where: { pseudo: createUserDto.pseudo },
    });

    if (existingUserByPseudo) {
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }

    try {
      // Hashe le mot de passe avec bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Crée l'utilisateur
      const user = this.usersRepository.create({
        email: createUserDto.email,
        pseudo: createUserDto.pseudo,
        password: hashedPassword,
      });

      // Enregistre l'utilisateur
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
}

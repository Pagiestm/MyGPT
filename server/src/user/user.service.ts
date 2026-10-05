import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.enum';
import { pageBounds, toPage, type PaginationDto } from '../common/pagination.dto';

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
      throw new NotFoundException(`Aucun utilisateur trouvé avec l'email ${email}`);
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
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

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
      throw new InternalServerErrorException("Une erreur est survenue lors de l'inscription");
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

  async updatePseudo(userId: string, newPseudo: string): Promise<{ message: string }> {
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

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.findOne(userId);
    if (dto.customInstructions !== undefined) {
      user.customInstructions = dto.customInstructions.trim() || null;
    }
    if (dto.preferredModel !== undefined) user.preferredModel = dto.preferredModel;

    const saved = await this.usersRepository.save(user);
    return {
      customInstructions: saved.customInstructions ?? null,
      preferredModel: saved.preferredModel ?? null,
    };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findOne(userId);

    try {
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
  async listAll(pagination: PaginationDto = {}) {
    const [items, total] = await this.usersRepository.findAndCount({
      select: { id: true, email: true, pseudo: true, role: true, created_at: true },
      order: { created_at: 'ASC' },
      ...pageBounds(pagination),
    });
    return toPage(items, total, pagination);
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (user.role === UserRole.Admin && role !== UserRole.Admin) {
      const admins = await this.usersRepository.countBy({ role: UserRole.Admin });
      if (admins <= 1) {
        throw new BadRequestException(
          "Impossible de retirer le dernier administrateur de l'instance",
        );
      }
    }

    user.role = role;
    await this.usersRepository.save(user);
    return { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role };
  }
}

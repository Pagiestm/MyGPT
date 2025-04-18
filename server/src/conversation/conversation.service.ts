import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SearchConversationDto } from './dto/search-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const conversation = this.conversationsRepository.create(
      createConversationDto,
    );
    return this.conversationsRepository.save(conversation);
  }

  async findAll(userId?: string): Promise<Conversation[]> {
    const whereCondition = userId ? { userId } : {};
    return this.conversationsRepository.find({
      where: whereCondition,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages', 'user'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation #${id} not found`);
    }

    return conversation;
  }

  async findByShareLink(shareLink: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { shareLink },
      relations: ['messages', 'user'],
    });

    if (!conversation) {
      throw new NotFoundException(`Shared conversation not found`);
    }

    // Vérifier si le lien n'est pas expiré
    if (
      conversation.shareExpiresAt &&
      new Date() > new Date(conversation.shareExpiresAt)
    ) {
      throw new BadRequestException('This share link has expired');
    }

    return conversation;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.findOne(id);

    // Mettre à jour les propriétés de la conversation
    Object.assign(conversation, updateConversationDto);

    return this.conversationsRepository.save(conversation);
  }

  async remove(id: string): Promise<void> {
    const conversation = await this.findOne(id);
    await this.conversationsRepository.remove(conversation);
  }

  async search(searchDto: SearchConversationDto): Promise<Conversation[]> {
    const { keyword, userId } = searchDto;

    // Utiliser les types FindOptionsWhere de TypeORM
    const whereConditions = [];

    // Condition 1: recherche par nom
    const nameCondition: Record<string, any> = { name: ILike(`%${keyword}%`) };
    if (userId) nameCondition.userId = userId;
    whereConditions.push(nameCondition);

    // Condition 2: recherche dans les messages
    const messageCondition: Record<string, any> = {
      messages: { content: ILike(`%${keyword}%`) },
    };
    if (userId) messageCondition.userId = userId;
    whereConditions.push(messageCondition);

    return this.conversationsRepository.find({
      where: whereConditions,
      relations: ['messages'],
      order: { updatedAt: 'DESC' },
    });
  }

  async shareConversation(
    id: string,
    shareDto: ShareConversationDto,
  ): Promise<{ shareLink: string }> {
    const conversation = await this.findOne(id);

    // Générer un lien de partage unique s'il n'existe pas déjà
    if (!conversation.shareLink) {
      conversation.shareLink = randomBytes(8).toString('hex');
    }

    // Mettre à jour la date d'expiration si elle est fournie
    if (shareDto.expiresAt) {
      conversation.shareExpiresAt = new Date(shareDto.expiresAt);
    }

    // Sauvegarder les modifications
    await this.conversationsRepository.save(conversation);

    return {
      shareLink: conversation.shareLink,
    };
  }

  async revokeShare(id: string): Promise<void> {
    const conversation = await this.findOne(id);

    conversation.shareLink = null;
    conversation.shareExpiresAt = null;

    await this.conversationsRepository.save(conversation);
  }
}

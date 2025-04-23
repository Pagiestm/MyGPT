import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, Not } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ShareConversationDto } from './dto/share-conversation.dto';
import { SearchConversationDto } from './dto/search-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { SaveSharedConversationDto } from './dto/saveShared-conversation.dto';

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

  // Sauvegarde une conversation partagée
  async saveSharedConversation(
    userId: string,
    saveDto: SaveSharedConversationDto,
  ): Promise<Conversation> {
    // 1. Vérifier si la conversation partagée existe
    const sharedConversation = await this.findByShareLink(saveDto.shareLink);

    if (
      !sharedConversation ||
      sharedConversation.id !== saveDto.conversationId
    ) {
      throw new BadRequestException(
        'Invalid shared conversation or share link',
      );
    }

    // 2. Créer une nouvelle conversation pour l'utilisateur
    const newConversation = this.conversationsRepository.create({
      name: saveDto.newName || `${sharedConversation.name} (Copie)`,
      userId: userId,
      sharedFrom: sharedConversation.id, // Référence la conversation d'origine
    });

    // 3. Sauvegarder la nouvelle conversation
    const savedConversation =
      await this.conversationsRepository.save(newConversation);

    // 4. Copie les messages de la conversation partagée
    if (sharedConversation.messages && sharedConversation.messages.length > 0) {
      const messagePromises = sharedConversation.messages.map((message) => {
        const newMessage = this.messagesRepository.create({
          conversationId: savedConversation.id,
          content: message.content,
          isFromAi: message.isFromAi,
        });
        return this.messagesRepository.save(newMessage);
      });

      await Promise.all(messagePromises);
    }

    // 5. Retourne la nouvelle conversation avec ses messages
    return this.findOne(savedConversation.id);
  }

  async findSavedByUser(userId: string): Promise<Conversation[]> {
    // Récupére les conversations où userId correspond et sharedFrom n'est pas null
    return this.conversationsRepository.find({
      where: {
        userId: userId,
        sharedFrom: Not(IsNull()),
      },
      order: { createdAt: 'DESC' },
      relations: ['messages'],
    });
  }
}

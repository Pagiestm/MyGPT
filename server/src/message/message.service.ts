import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SearchMessagesDto } from './dto/search-message.dto';
import { IAiAdapter } from '../infrastructure/adapters/GeminiAiAdapter';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @Inject('IAiAdapter')
    private aiAdapter: IAiAdapter,
    private conversationService: ConversationService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    // Vérifier que la conversation existe
    await this.conversationService.findOne(createMessageDto.conversationId);

    // Créer et sauvegarder le message de l'utilisateur
    const userMessage = this.messagesRepository.create(createMessageDto);
    await this.messagesRepository.save(userMessage);

    // Si le message n'est pas de l'IA, générer une réponse de l'IA
    if (!createMessageDto.isFromAi) {
      // Récupérer l'historique de la conversation pour plus de contexte
      const conversationHistory = await this.getConversationHistory(
        createMessageDto.conversationId,
      );

      // Obtenir une réponse de l'IA via l'adaptateur
      const aiResponse = await this.aiAdapter.getAiResponse(
        createMessageDto.content,
        conversationHistory,
      );

      // Créer et sauvegarder la réponse de l'IA
      const aiMessage = this.messagesRepository.create({
        content: aiResponse,
        conversationId: createMessageDto.conversationId,
        isFromAi: true,
      });
      await this.messagesRepository.save(aiMessage);
    }

    return userMessage;
  }

  async findAll(conversationId?: string): Promise<Message[]> {
    const whereCondition = conversationId ? { conversationId } : {};

    return this.messagesRepository.find({
      where: whereCondition,
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    regenerateAiResponse: boolean = true,
  ): Promise<Message> {
    const message = await this.findOne(id);

    // Si le message est de l'IA, on ne peut pas le modifier
    if (message.isFromAi) {
      throw new BadRequestException('Cannot update AI messages');
    }

    // Mettre à jour le contenu du message
    message.content = updateMessageDto.content;
    await this.messagesRepository.save(message);

    if (regenerateAiResponse) {
      const subsequentMessages = await this.messagesRepository
        .createQueryBuilder('message')
        .where('message.conversationId = :conversationId', {
          conversationId: message.conversationId,
        })
        .andWhere('message.createdAt > :messageDate', {
          messageDate: message.createdAt,
        })
        .andWhere('message.id != :messageId', {
          // Cette ligne garantit que le message modifié n'est pas inclus
          messageId: message.id,
        })
        .orderBy('message.createdAt', 'ASC')
        .getMany();

      // Si des messages suivants existent, les supprimer
      if (subsequentMessages.length > 0) {
        await this.messagesRepository.remove(subsequentMessages);
      }

      const conversationHistory = await this.getConversationHistory(
        message.conversationId,
      );

      const newAiResponse = await this.aiAdapter.getAiResponse(
        message.content,
        conversationHistory,
      );

      const newAiMessage = this.messagesRepository.create({
        content: newAiResponse,
        conversationId: message.conversationId,
        isFromAi: true,
      });

      await this.messagesRepository.save(newAiMessage);
    }

    return message;
  }

  async searchInConversation(searchDto: SearchMessagesDto): Promise<Message[]> {
    const { keyword, conversationId } = searchDto;

    return this.messagesRepository.find({
      where: {
        conversationId,
        content: ILike(`%${keyword}%`),
      },
      order: { createdAt: 'ASC' },
    });
  }

  private async getConversationHistory(
    conversationId: string,
    untilMessageId?: string,
  ): Promise<string[]> {
    const query = this.messagesRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'ASC');

    if (untilMessageId) {
      query.andWhere('message.id <= :messageId', { messageId: untilMessageId });
    }

    const messages = await query.getMany();

    return messages.map((message) => {
      const prefix = message.isFromAi ? 'AI: ' : 'User: ';
      return `${prefix}${message.content}`;
    });
  }
}

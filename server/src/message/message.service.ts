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
    regenerateAiResponse: boolean = false,
  ): Promise<Message> {
    const message = await this.findOne(id);

    // Si le message est de l'IA, on ne peut pas le modifier
    if (message.isFromAi) {
      throw new BadRequestException('Cannot update AI messages');
    }

    // Mettre à jour le contenu du message
    message.content = updateMessageDto.content;
    await this.messagesRepository.save(message);

    // Si demandé, régénérer la réponse de l'IA
    if (regenerateAiResponse) {
      // Trouver le message de l'IA qui suit ce message
      const nextAiMessage = await this.messagesRepository
        .createQueryBuilder('message')
        .where('message.conversationId = :conversationId', {
          conversationId: message.conversationId,
        })
        .andWhere('message.isFromAi = :isFromAi', { isFromAi: true })
        .andWhere('message.createdAt > :messageDate', {
          messageDate: message.createdAt,
        })
        .orderBy('message.createdAt', 'ASC')
        .limit(1)
        .getOne();

      if (nextAiMessage) {
        // Récupérer l'historique jusqu'au message modifié
        const conversationHistory = await this.getConversationHistory(
          message.conversationId,
          message.id,
        );

        // Obtenir une nouvelle réponse de l'IA
        const newAiResponse = await this.aiAdapter.getAiResponse(
          updateMessageDto.content,
          conversationHistory,
        );

        // Mettre à jour le message de l'IA
        nextAiMessage.content = newAiResponse;
        await this.messagesRepository.save(nextAiMessage);
      }
    }

    return message;
  }

  async remove(id: string): Promise<void> {
    const message = await this.findOne(id);
    await this.messagesRepository.remove(message);
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

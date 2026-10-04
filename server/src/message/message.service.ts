import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { SearchMessagesDto } from './dto/search-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async findAll(conversationId?: string): Promise<Message[]> {
    const whereCondition = conversationId ? { conversationId } : {};
    return this.messagesRepository.find({
      where: whereCondition,
      relations: { attachments: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: { conversation: true },
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
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

  // Recherche dans toutes les conversations de l'utilisateur (palette Ctrl+K)
  async searchForUser(userId: string, keyword: string, limit = 20): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { content: ILike(`%${keyword}%`), conversation: { userId } },
      relations: { conversation: true },
      select: {
        id: true,
        content: true,
        isFromAi: true,
        createdAt: true,
        conversationId: true,
        conversation: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { SearchMessagesDto } from './dto/search-message.dto';
import { pageBounds, toPage, type Page, type PaginationDto } from '../common/pagination.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async findAll(conversationId?: string, pagination: PaginationDto = {}): Promise<Page<Message>> {
    const [newestFirst, total] = await this.messagesRepository.findAndCount({
      where: conversationId ? { conversationId } : {},
      relations: { attachments: true },
      order: { createdAt: 'DESC' },
      ...pageBounds(pagination),
    });
    return toPage(newestFirst.reverse(), total, pagination);
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

  async searchInConversation(searchDto: SearchMessagesDto): Promise<Page<Message>> {
    const { keyword, conversationId } = searchDto;
    const [items, total] = await this.messagesRepository.findAndCount({
      where: { conversationId, content: ILike(`%${keyword}%`) },
      order: { createdAt: 'ASC' },
      ...pageBounds(searchDto),
    });
    return toPage(items, total, searchDto);
  }

  async searchForUser(
    userId: string,
    keyword: string,
    pagination: PaginationDto = {},
  ): Promise<Page<Message>> {
    const [items, total] = await this.messagesRepository.findAndCount({
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
      ...pageBounds(pagination),
    });
    return toPage(items, total, pagination);
  }
}

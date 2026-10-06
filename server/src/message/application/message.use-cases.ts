import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Page, PaginationDto } from '../../common/http/pagination.dto';
import { toPage } from '../../common/http/pagination.dto';
import { GetReadableConversation } from '../../conversation/application/conversation.use-cases';
import type { Message } from '../domain/message';
import {
  MESSAGE_REPOSITORY,
  type MessageHit,
  type MessageRepository,
} from '../domain/message.repository';

const MIN_KEYWORD_LENGTH = 2;

@Injectable()
export class ListMessages {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly readable: GetReadableConversation,
  ) {}

  async execute(
    conversationId: string,
    userId: string,
    pagination: PaginationDto = {},
  ): Promise<Page<Message>> {
    await this.readable.execute(conversationId, userId);
    return this.messages.listForConversation(conversationId, pagination);
  }
}

@Injectable()
export class SearchInConversation {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly readable: GetReadableConversation,
  ) {}

  async execute(
    conversationId: string,
    userId: string,
    keyword: string,
    pagination: PaginationDto = {},
  ): Promise<Page<Message>> {
    await this.readable.execute(conversationId, userId);
    return this.messages.searchInConversation(conversationId, keyword, pagination);
  }
}

@Injectable()
export class SearchUserMessages {
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository) {}

  execute(
    userId: string,
    keyword: string,
    pagination: PaginationDto = {},
  ): Promise<Page<MessageHit>> {
    const trimmed = keyword.trim();
    if (trimmed.length < MIN_KEYWORD_LENGTH)
      return Promise.resolve(toPage<MessageHit>([], 0, pagination));
    return this.messages.searchForUser(userId, trimmed, pagination);
  }
}

@Injectable()
export class GetMessage {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
    private readonly readable: GetReadableConversation,
  ) {}

  async execute(id: string, userId: string): Promise<Message> {
    const message = await this.messages.findById(id);
    if (!message) throw new NotFoundException(`Message with ID ${id} not found`);
    await this.readable.execute(message.conversationId, userId);
    return message;
  }
}

import type { Page, PaginationDto } from '../../common/http/pagination.dto';
import type { Message } from './message';

export interface MessageHit {
  message: Message;
  conversationName: string;
}

export const MESSAGE_REPOSITORY = Symbol('MessageRepository');

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  findThread(conversationId: string): Promise<Message[]>;
  findBefore(conversationId: string, instant: Date, excludedId: string): Promise<Message[]>;
  findAfter(conversationId: string, instant: Date, excludedId: string): Promise<Message[]>;
  listForConversation(conversationId: string, pagination: PaginationDto): Promise<Page<Message>>;
  searchInConversation(
    conversationId: string,
    keyword: string,
    pagination: PaginationDto,
  ): Promise<Page<Message>>;
  searchForUser(
    userId: string,
    keyword: string,
    pagination: PaginationDto,
  ): Promise<Page<MessageHit>>;
  countAnswers(conversationId: string): Promise<number>;
  conversationIdOf(messageId: string): Promise<string | null>;
  save(message: Message): Promise<Message>;
  saveMany(messages: Message[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

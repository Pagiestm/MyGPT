import type { Page, PaginationDto } from '../../common/pagination.dto';
import type { Conversation } from './conversation';

export const CONVERSATION_REPOSITORY = Symbol('ConversationRepository');

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByShareLink(shareLink: string): Promise<Conversation | null>;
  listForUser(
    userId: string,
    options: { archived: boolean },
    pagination: PaginationDto,
  ): Promise<Page<Conversation>>;
  listSavedByUser(userId: string, pagination: PaginationDto): Promise<Page<Conversation>>;
  search(userId: string, keyword: string, pagination: PaginationDto): Promise<Page<Conversation>>;
  ownerPseudoOf(id: string): Promise<string | null>;
  folderInstructionsOf(id: string): Promise<{ name: string; instructions: string | null } | null>;
  save(conversation: Conversation): Promise<Conversation>;
  touch(id: string): Promise<void>;
  remove(id: string): Promise<void>;
}

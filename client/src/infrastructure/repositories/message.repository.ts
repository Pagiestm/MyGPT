import { http } from '../http/client';
import type { Message, MessageSearchResult } from '@/domain/message';
import { PAGE_SIZE, type Page } from '@/domain/pagination';

export const messageRepository = {
  list: (conversationId: string, offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<Message>>('/messages', { params: { conversationId, offset, limit } })
      .then((r) => r.data),
  search: (conversationId: string, keyword: string, offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<Message>>('/messages/search', {
        params: { conversationId, keyword, offset, limit },
      })
      .then((r) => r.data),
  searchAll: (keyword: string, offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<MessageSearchResult>>('/messages/search/all', {
        params: { keyword, offset, limit },
      })
      .then((r) => r.data),
};

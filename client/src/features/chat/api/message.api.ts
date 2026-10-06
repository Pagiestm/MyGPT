import { http } from '@/shared/lib/http';
import type { Message, MessageSearchResult } from '@/features/chat/types/message';
import { PAGE_SIZE, type Page } from '@/shared/types/pagination';

export const messageApi = {
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

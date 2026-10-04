import { http } from '../http/client';
import type { Message, MessageSearchResult } from '@/domain/message';

export const messageRepository = {
  list: (conversationId: string) =>
    http.get<Message[]>('/messages', { params: { conversationId } }).then((r) => r.data),
  search: (conversationId: string, keyword: string) =>
    http
      .get<Message[]>('/messages/search', { params: { conversationId, keyword } })
      .then((r) => r.data),
  searchAll: (keyword: string) =>
    http
      .get<MessageSearchResult[]>('/messages/search/all', { params: { keyword } })
      .then((r) => r.data),
};

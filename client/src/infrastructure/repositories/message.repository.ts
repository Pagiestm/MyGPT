import { http } from '../http/client';
import type { Message } from '@/domain/message';

export const messageRepository = {
  list: (conversationId: string) =>
    http.get<Message[]>('/messages', { params: { conversationId } }).then((r) => r.data),
  send: (conversationId: string, content: string) =>
    http.post<Message>('/messages', { conversationId, content }).then((r) => r.data),
  edit: (id: string, content: string) =>
    http.patch<Message>(`/messages/${id}`, { content }, { params: { regenerateAi: true } }),
  search: (conversationId: string, keyword: string) =>
    http
      .get<Message[]>('/messages/search', { params: { conversationId, keyword } })
      .then((r) => r.data),
};

import { http } from '../http/client';
import type { Conversation, SharedConversation } from '@/domain/conversation';

export const conversationRepository = {
  list: (keyword?: string) =>
    http
      .get<Conversation[]>(keyword ? '/conversations/search' : '/conversations', {
        params: keyword ? { keyword } : undefined,
      })
      .then((r) => r.data),
  get: (id: string) => http.get<Conversation>(`/conversations/${id}`).then((r) => r.data),
  create: (name: string) => http.post<Conversation>('/conversations', { name }).then((r) => r.data),
  rename: (id: string, name: string) =>
    http.patch<Conversation>(`/conversations/${id}`, { name }).then((r) => r.data),
  remove: (id: string) => http.delete(`/conversations/${id}`),

  share: (id: string, expiresAt?: string) =>
    http.post<Conversation>(`/conversations/${id}/share`, { expiresAt }).then((r) => r.data),
  revokeShare: (id: string) => http.delete(`/conversations/${id}/share`),
  getShared: (link: string) =>
    http.get<SharedConversation>(`/conversations/shared/${link}`).then((r) => r.data),
  saveShared: (conversationId: string, shareLink: string) =>
    http
      .post<Conversation>('/conversations/save-shared', { conversationId, shareLink })
      .then((r) => r.data),
  listSaved: () => http.get<Conversation[]>('/conversations/saved').then((r) => r.data),
};

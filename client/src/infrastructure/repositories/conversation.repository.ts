import { http } from '../http/client';
import type { Conversation, ConversationPatch, SharedConversation } from '@/domain/conversation';
import { PAGE_SIZE, type Page } from '@/domain/pagination';

export const conversationRepository = {
  list: (keyword?: string, offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<Conversation>>(keyword ? '/conversations/search' : '/conversations', {
        params: { ...(keyword ? { keyword } : {}), offset, limit },
      })
      .then((r) => r.data),
  listArchived: (offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<Conversation>>('/conversations', { params: { archived: true, offset, limit } })
      .then((r) => r.data),
  get: (id: string) => http.get<Conversation>(`/conversations/${id}`).then((r) => r.data),
  create: (name: string, folderId?: string | null) =>
    http.post<Conversation>('/conversations', { name, folderId }).then((r) => r.data),
  update: (id: string, patch: ConversationPatch) =>
    http.patch<Conversation>(`/conversations/${id}`, patch).then((r) => r.data),
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
  listSaved: (offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<Conversation>>('/conversations/saved', { params: { offset, limit } })
      .then((r) => r.data),
};

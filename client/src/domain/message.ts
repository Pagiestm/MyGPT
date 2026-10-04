import type { Attachment } from './attachment';

export interface Message {
  id: string;
  content: string;
  conversationId: string;
  isFromAi: boolean;
  model?: string | null;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageSearchResult extends Message {
  conversation: { id: string; name: string };
}

export function sortByDate(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

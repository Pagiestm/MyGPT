import { http } from '../http/client';
import { postEventStream } from '../http/stream';
import type { AiModels } from '@/domain/ai';
import type { Message } from '@/domain/message';

export type ChatEvent =
  | { type: 'user'; message: Message }
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }
  | { type: 'title'; conversationId: string; name: string }
  | { type: 'error'; message: string };

type Listener = (event: ChatEvent) => void;

export const chatRepository = {
  models: () => http.get<AiModels>('/chat/models').then((r) => r.data),

  send: (
    body: { conversationId: string; content: string; attachmentIds?: string[]; model?: string },
    onEvent: Listener,
    signal?: AbortSignal,
  ) => postEventStream('/chat/messages', body, onEvent, signal),

  regenerate: (
    conversationId: string,
    model: string | undefined,
    onEvent: Listener,
    signal?: AbortSignal,
  ) =>
    postEventStream(`/chat/conversations/${conversationId}/regenerate`, { model }, onEvent, signal),

  edit: (
    messageId: string,
    body: { content: string; model?: string },
    onEvent: Listener,
    signal?: AbortSignal,
  ) => postEventStream(`/chat/messages/${messageId}/edit`, body, onEvent, signal),
};

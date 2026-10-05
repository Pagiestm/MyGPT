import type { Message } from '@/domain/message';
import { http } from '../http/client';
import { WebgpuUnavailableError, webllmRepository, type PromptMessage } from './webllm.repository';
export type ChatEvent =
  | { type: 'user'; message: Message }
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }
  | { type: 'title'; conversationId: string; name: string }
  | { type: 'error'; message: string };

type Listener = (event: ChatEvent) => void;

interface LocalExchange {
  question: Message;
  messages: PromptMessage[];
}

interface SavedReply {
  message: Message;
  needsTitle: boolean;
}

const AI_ERROR = "Désolé, je n'ai pas pu générer de réponse. Vous pouvez réessayer.";

export const chatRepository = {
  send: (
    body: {
      conversationId: string;
      content: string;
      attachmentIds?: string[];
      model: string;
      revision?: number;
      questionEmbedding?: number[];
    },
    onEvent: Listener,
    signal?: AbortSignal,
  ) =>
    exchange(
      () => http.post<LocalExchange>('/chat/messages', body).then((r) => r.data),
      { model: body.model, revision: body.revision, announceQuestion: true },
      onEvent,
      signal,
    ),

  regenerate: (
    conversationId: string,
    body: { model: string; revision?: number; questionEmbedding?: number[] },
    onEvent: Listener,
    signal?: AbortSignal,
  ) =>
    exchange(
      () =>
        http
          .post<LocalExchange>(`/chat/conversations/${conversationId}/regenerate`, body)
          .then((r) => r.data),
      { model: body.model, revision: body.revision, announceQuestion: false },
      onEvent,
      signal,
    ),

  edit: (
    messageId: string,
    body: { content: string; model: string; revision?: number; questionEmbedding?: number[] },
    onEvent: Listener,
    signal?: AbortSignal,
  ) =>
    exchange(
      () => http.post<LocalExchange>(`/chat/messages/${messageId}/edit`, body).then((r) => r.data),
      { model: body.model, revision: body.revision, announceQuestion: true },
      onEvent,
      signal,
    ),
};

async function exchange(
  prepare: () => Promise<LocalExchange>,
  {
    model,
    revision,
    announceQuestion,
  }: { model: string; revision?: number; announceQuestion: boolean },
  onEvent: Listener,
  signal?: AbortSignal,
) {
  const { question, messages } = await prepare();
  if (announceQuestion) onEvent({ type: 'user', message: question });

  let text = '';
  let failed = false;
  try {
    await webllmRepository.chat(
      { model, messages, revision },
      (delta) => {
        text += delta;
        onEvent({ type: 'delta', text: delta });
      },
      signal,
    );
  } catch (error) {
    if (signal?.aborted) {
      if (!text) return;
    } else {
      failed = true;
      if (!text) {
        onEvent({ type: 'error', message: explain(error) });
        return;
      }
    }
  }

  if (!text) return;

  const { message, needsTitle } = await http
    .post<SavedReply>('/chat/replies', {
      conversationId: question.conversationId,
      content: text,
      model,
    })
    .then((r) => r.data);
  onEvent({ type: 'done', message });

  if (failed) {
    onEvent({ type: 'error', message: AI_ERROR });
    return;
  }
  if (needsTitle && !signal?.aborted) {
    await nameConversation(question, text, model, onEvent);
  }
}

async function nameConversation(
  question: Message,
  answer: string,
  model: string,
  onEvent: Listener,
) {
  const name = await webllmRepository.generateTitle(model, question.content, answer);
  if (!name) return;
  const saved = await http
    .post('/chat/titles', { conversationId: question.conversationId, name })
    .then(() => true)
    .catch(() => false);
  if (saved) onEvent({ type: 'title', conversationId: question.conversationId, name });
}

function explain(error: unknown) {
  if (error instanceof WebgpuUnavailableError) return error.message;
  if (!(error instanceof Error) || !error.message) return AI_ERROR;
  if (/out of memory|device lost|OOM/i.test(error.message)) {
    return 'La mémoire graphique est insuffisante pour ce modèle. Choisissez-en un plus léger.';
  }
  return error.message;
}

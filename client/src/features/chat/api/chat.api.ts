import type { Message } from '@/features/chat/types/message';
import { http } from '@/shared/lib/http';
import {
  ModelDownloadCancelledError,
  ModelUnsupportedError,
  WebgpuUnavailableError,
  webllm,
  type PromptMessage,
} from '@/features/models';
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

const REASONS: Record<string, string> = {
  DeviceLostError:
    'Le GPU a cédé en cours de route, le plus souvent faute de mémoire. Choisissez un modèle plus léger.',
  ContextWindowSizeExceededError:
    'La conversation dépasse la fenêtre de contexte du modèle. Ouvrez une nouvelle conversation ou prenez un modèle au contexte plus large.',
  ShaderF16SupportError:
    "Ce modèle exige un GPU compatible f16, que cet appareil n'a pas. Choisissez-en un autre.",
  WebGPUNotAvailableError: "Cet appareil n'expose pas WebGPU.",
  WebGPUNotFoundError: "Aucun GPU utilisable n'a été trouvé sur cet appareil.",
  ModelNotLoadedError: "Le modèle n'était plus chargé. Relancez la génération.",
  WorkerEngineModelNotLoadedError: "Le modèle n'était plus chargé. Relancez la génération.",
};

export const chatApi = {
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
  let failure: string | null = null;
  try {
    await webllm.chat(
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
      failure = explain(error);
      if (!text) {
        onEvent({ type: 'error', message: failure });
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

  if (failure) {
    onEvent({ type: 'error', message: `Réponse interrompue. ${failure}` });
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
  const name = await webllm.generateTitle(model, question.content, answer);
  if (!name) return;
  const saved = await http
    .post('/chat/titles', { conversationId: question.conversationId, name })
    .then(() => true)
    .catch(() => false);
  if (saved) onEvent({ type: 'title', conversationId: question.conversationId, name });
}

function explain(error: unknown) {
  if (error instanceof ModelDownloadCancelledError) return error.message;
  if (error instanceof ModelUnsupportedError) return error.message;
  if (error instanceof WebgpuUnavailableError) return error.message;
  if (!(error instanceof Error) || !error.message) return AI_ERROR;
  if (REASONS[error.name]) return REASONS[error.name]!;
  if (/out of memory|device lost|OOM/i.test(error.message)) {
    return 'La mémoire graphique est insuffisante pour ce modèle. Choisissez-en un plus léger.';
  }
  return error.message;
}

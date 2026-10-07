import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import { useQueryCache } from '@pinia/colada';
import type { Attachment } from '@/features/chat/types/attachment';
import type { Conversation } from '@/features/chat/types/conversation';
import type { Message } from '@/features/chat/types/message';
import { emptyPage, type Page } from '@/shared/types/pagination';
import { getErrorMessage } from '@/shared/lib/http';
import { chatApi, type ChatEvent } from '@/features/chat/api/chat.api';
import { ModelDownloadCancelledError, useGpuCapabilities, webllm } from '@/features/models';
import { useAuthStore } from '@/features/auth';
import { useDocuments } from '@/features/knowledge';
import { useModels } from '@/features/models';
import { queryKeys } from '@/shared/lib/queryKeys';

export const STREAMING_ID = 'streaming';

type Phase = 'idle' | 'submitted' | 'streaming';
type Start = (onEvent: (event: ChatEvent) => void, signal: AbortSignal) => Promise<void>;

export function useChatStream(
  conversationId: MaybeRefOrGetter<string>,
  { onError }: { onError: (message: string) => void },
) {
  const cache = useQueryCache();
  const auth = useAuthStore();
  const { data: catalog, models } = useModels();
  const { items: documents } = useDocuments();
  const { recommend } = useGpuCapabilities();
  const phase = ref<Phase>('idle');
  let controller: AbortController | null = null;

  const effective = (requested?: string) =>
    requested ??
    auth.user?.preferredModel ??
    recommend(models.value) ??
    catalog.value?.defaultModel;

  function requireModel(requested?: string) {
    const chosen = effective(requested);
    if (!chosen) {
      throw new Error(
        'Aucun modèle disponible : ce navigateur ne gère pas WebGPU. Essayez Chrome, Edge, ' +
          'Safari 26+ ou Firefox récent.',
      );
    }
    return { model: chosen, revision: models.value.find((item) => item.id === chosen)?.revision };
  }

  async function embedQuestion(text: string, signal: AbortSignal) {
    if (!documents.value.length || !text.trim()) return undefined;
    try {
      const [vector] = await webllm.embed([text.slice(0, 2000)], signal);
      return vector;
    } catch (error) {
      if (error instanceof ModelDownloadCancelledError) throw error;
      return undefined;
    }
  }

  const busy = computed(() => phase.value !== 'idle');

  async function run(
    prepare: (now: string) => Message[] | void,
    start: Start,
    questionId?: string,
  ) {
    if (busy.value) return;
    const id = toValue(conversationId);
    const key = queryKeys.messages(id);
    const update = (change: (list: Message[]) => Message[]) =>
      cache.setQueryData<Page<Message>>(key, (old = emptyPage<Message>()) => ({
        ...old,
        items: change(old.items),
      }));

    const now = new Date().toISOString();
    update((list) => [
      ...(prepare(now) ?? list),
      {
        id: STREAMING_ID,
        content: '',
        conversationId: id,
        isFromAi: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const handle = (event: ChatEvent) => {
      switch (event.type) {
        case 'user':
          update((list) =>
            list.map((m) => (m.id === questionId || m.id === event.message.id ? event.message : m)),
          );
          break;
        case 'delta':
          phase.value = 'streaming';
          update((list) =>
            list.map((m) =>
              m.id === STREAMING_ID ? { ...m, content: m.content + event.text } : m,
            ),
          );
          break;
        case 'done':
          update((list) => list.map((m) => (m.id === STREAMING_ID ? event.message : m)));
          break;
        case 'title':
          cache.setQueryData<Conversation>(queryKeys.conversation(id), (old) =>
            old ? { ...old, name: event.name } : old!,
          );
          break;
        case 'error':
          update((list) => list.filter((m) => m.id !== STREAMING_ID));
          onError(event.message);
          break;
      }
    };

    controller = new AbortController();
    const { signal } = controller;
    phase.value = 'submitted';
    try {
      await start(handle, signal);
    } catch (error) {
      if (signal.aborted || error instanceof ModelDownloadCancelledError) {
        update((list) => list.filter((m) => m.id !== STREAMING_ID || m.content));
      } else {
        update((list) =>
          list.filter(
            (m) => m.id !== STREAMING_ID && !(m.id === questionId && m.id.startsWith('pending-')),
          ),
        );
        onError(getErrorMessage(error, "Le message n'a pas pu être envoyé"));
      }
    } finally {
      controller = null;
      phase.value = 'idle';
      if (signal.aborted) await new Promise((resolve) => setTimeout(resolve, 800));
      await Promise.all([
        cache.invalidateQueries({ key }),
        cache.invalidateQueries({ key: queryKeys.conversations }),
      ]);
    }
  }

  function send(content: string, attachments: Attachment[] = [], model?: string) {
    const questionId = `pending-${Date.now()}`;
    return run(
      (now) => {
        const list =
          cache.getQueryData<Page<Message>>(queryKeys.messages(toValue(conversationId)))?.items ??
          [];
        return [
          ...list,
          {
            id: questionId,
            content,
            attachments,
            conversationId: toValue(conversationId),
            isFromAi: false,
            createdAt: now,
            updatedAt: now,
          },
        ];
      },
      async (onEvent, signal) => {
        const chosen = requireModel(model);
        return chatApi.send(
          {
            conversationId: toValue(conversationId),
            content,
            attachmentIds: attachments.map((attachment) => attachment.id),
            ...chosen,
            questionEmbedding: await embedQuestion(content, signal),
          },
          onEvent,
          signal,
        );
      },
      questionId,
    );
  }

  function regenerate(model?: string) {
    return run(
      () => {
        const list =
          cache.getQueryData<Page<Message>>(queryKeys.messages(toValue(conversationId)))?.items ??
          [];
        return list.at(-1)?.isFromAi ? list.slice(0, -1) : list;
      },
      async (onEvent, signal) => {
        const chosen = requireModel(model);
        const page = cache.getQueryData<Page<Message>>(queryKeys.messages(toValue(conversationId)));
        const asked = [...(page?.items ?? [])].reverse().find((item) => !item.isFromAi);
        return chatApi.regenerate(
          toValue(conversationId),
          { ...chosen, questionEmbedding: await embedQuestion(asked?.content ?? '', signal) },
          onEvent,
          signal,
        );
      },
    );
  }

  function edit(messageId: string, content: string, model?: string) {
    return run(
      () => {
        const list =
          cache.getQueryData<Page<Message>>(queryKeys.messages(toValue(conversationId)))?.items ??
          [];
        const index = list.findIndex((message) => message.id === messageId);
        return index === -1 ? list : [...list.slice(0, index), { ...list[index]!, content }];
      },
      async (onEvent, signal) => {
        const chosen = requireModel(model);
        return chatApi.edit(
          messageId,
          { content, ...chosen, questionEmbedding: await embedQuestion(content, signal) },
          onEvent,
          signal,
        );
      },
      messageId,
    );
  }

  function stop() {
    controller?.abort();
  }

  return { phase, busy, send, regenerate, edit, stop };
}

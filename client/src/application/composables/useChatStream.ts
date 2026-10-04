import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import { useQueryCache } from '@pinia/colada';
import type { Attachment } from '@/domain/attachment';
import type { Conversation } from '@/domain/conversation';
import type { Message } from '@/domain/message';
import { getErrorMessage } from '@/infrastructure/http/client';
import { chatRepository, type ChatEvent } from '@/infrastructure/repositories/chat.repository';
import { queryKeys } from '../queryKeys';

/** Identifiant de la réponse en cours d'écriture, tant que le serveur ne l'a pas enregistrée */
export const STREAMING_ID = 'streaming';

type Phase = 'idle' | 'submitted' | 'streaming';
type Start = (onEvent: (event: ChatEvent) => void, signal: AbortSignal) => Promise<void>;

/**
 * Échanges en flux avec l'IA : envoi, régénération et modification.
 * La question et la réponse en cours sont ajoutées au cache tout de suite, puis complétées
 * morceau par morceau et remplacées par les messages enregistrés par le serveur.
 */
export function useChatStream(
  conversationId: MaybeRefOrGetter<string>,
  { onError }: { onError: (message: string) => void },
) {
  const cache = useQueryCache();
  const phase = ref<Phase>('idle');
  let controller: AbortController | null = null;

  const busy = computed(() => phase.value !== 'idle');

  async function run(
    prepare: (now: string) => Message[] | void,
    start: Start,
    questionId?: string,
  ) {
    if (busy.value) return;
    // Clé figée : la réponse continue d'arriver dans la bonne conversation si l'on navigue ailleurs
    const id = toValue(conversationId);
    const key = queryKeys.messages(id);
    const update = (change: (list: Message[]) => Message[]) =>
      cache.setQueryData<Message[]>(key, (old = []) => change(old));

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
      if (signal.aborted) {
        update((list) => list.filter((m) => m.id !== STREAMING_ID || m.content));
      } else {
        // Une question jamais enregistrée (id temporaire) disparaît ; une question modifiée reste
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
      // Après un arrêt, le serveur enregistre la réponse partielle : on lui laisse un instant
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
          cache.getQueryData<Message[]>(queryKeys.messages(toValue(conversationId))) ?? [];
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
      (onEvent, signal) =>
        chatRepository.send(
          {
            conversationId: toValue(conversationId),
            content,
            attachmentIds: attachments.map((attachment) => attachment.id),
            model,
          },
          onEvent,
          signal,
        ),
      questionId,
    );
  }

  function regenerate(model?: string) {
    return run(
      () => {
        const list =
          cache.getQueryData<Message[]>(queryKeys.messages(toValue(conversationId))) ?? [];
        return list.at(-1)?.isFromAi ? list.slice(0, -1) : list;
      },
      (onEvent, signal) =>
        chatRepository.regenerate(toValue(conversationId), model, onEvent, signal),
    );
  }

  function edit(messageId: string, content: string, model?: string) {
    return run(
      () => {
        const list =
          cache.getQueryData<Message[]>(queryKeys.messages(toValue(conversationId))) ?? [];
        const index = list.findIndex((message) => message.id === messageId);
        return index === -1 ? list : [...list.slice(0, index), { ...list[index]!, content }];
      },
      (onEvent, signal) => chatRepository.edit(messageId, { content, model }, onEvent, signal),
      messageId,
    );
  }

  function stop() {
    controller?.abort();
  }

  return { phase, busy, send, regenerate, edit, stop };
}

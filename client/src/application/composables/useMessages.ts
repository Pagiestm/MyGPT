import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { Message } from '@/domain/message';
import { messageRepository } from '@/infrastructure/repositories/message.repository';
import { queryKeys } from '../queryKeys';

export function useMessageList(conversationId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.messages(toValue(conversationId)),
    query: () => messageRepository.list(toValue(conversationId)),
  });
}

export function useMessageSearch(
  conversationId: MaybeRefOrGetter<string>,
  keyword: MaybeRefOrGetter<string>,
) {
  return useQuery({
    key: () => queryKeys.messageSearch(toValue(conversationId), toValue(keyword).trim()),
    query: () => messageRepository.search(toValue(conversationId), toValue(keyword).trim()),
    enabled: () => toValue(keyword).trim().length > 0,
  });
}

export function useSendMessage(conversationId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache();

  return useMutation({
    mutation: (content: string) => messageRepository.send(toValue(conversationId), content),
    onMutate(content) {
      // Affiche la question tout de suite : le serveur ne répond qu'après la réponse de l'IA
      const now = new Date().toISOString();
      const optimistic: Message = {
        id: `pending-${Date.now()}`,
        content,
        conversationId: toValue(conversationId),
        isFromAi: false,
        createdAt: now,
        updatedAt: now,
      };
      cache.setQueryData<Message[]>(queryKeys.messages(toValue(conversationId)), (old = []) => [
        ...old,
        optimistic,
      ]);
    },
    async onSettled() {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.messages(toValue(conversationId)) }),
        cache.invalidateQueries({ key: queryKeys.conversations }),
      ]);
    },
  });
}

export function useEditMessage(conversationId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache();

  return useMutation({
    mutation: ({ messageId, content }: { messageId: string; content: string }) =>
      messageRepository.edit(messageId, content),
    onMutate({ messageId, content }) {
      // L'IA régénère la suite : les messages suivants disparaissent tout de suite
      cache.setQueryData<Message[]>(queryKeys.messages(toValue(conversationId)), (old = []) => {
        const index = old.findIndex((message) => message.id === messageId);
        if (index === -1) return old;
        return [...old.slice(0, index), { ...old[index], content }];
      });
    },
    onSettled: () => cache.invalidateQueries({ key: queryKeys.messages(toValue(conversationId)) }),
  });
}

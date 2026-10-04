import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { nameFromPrompt, shareExpiration } from '@/domain/conversation';
import { conversationRepository } from '@/infrastructure/repositories/conversation.repository';
import { queryKeys } from '../queryKeys';

export function useConversationList(keyword: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => [...queryKeys.conversations, toValue(keyword).trim()],
    query: () => conversationRepository.list(toValue(keyword).trim() || undefined),
    placeholderData: (previous) => previous,
  });
}

export function useConversation(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.conversation(toValue(id)),
    query: () => conversationRepository.get(toValue(id)),
  });
}

export function useCreateConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (prompt: string) => conversationRepository.create(nameFromPrompt(prompt)),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.conversations }),
  });
}

export function useRenameConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, name }: { id: string; name: string }) =>
      conversationRepository.rename(id, name),
    async onSettled(_data, _error, { id }) {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.conversations }),
        cache.invalidateQueries({ key: queryKeys.conversation(id) }),
      ]);
    },
  });
}

export function useDeleteConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => conversationRepository.remove(id),
    async onSettled() {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.conversations }),
        cache.invalidateQueries({ key: queryKeys.saved }),
      ]);
    },
  });
}

export function useShareConversation(id: MaybeRefOrGetter<string>) {
  const cache = useQueryCache();
  const refresh = () => cache.invalidateQueries({ key: queryKeys.conversation(toValue(id)) });

  const share = useMutation({
    mutation: (days: number | null) =>
      conversationRepository.share(toValue(id), shareExpiration(days)),
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutation: () => conversationRepository.revokeShare(toValue(id)),
    onSettled: refresh,
  });
  return { share, revoke };
}

export function useSharedConversation(link: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.shared(toValue(link)),
    query: () => conversationRepository.getShared(toValue(link)),
  });
}

export function useSaveSharedConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ conversationId, link }: { conversationId: string; link: string }) =>
      conversationRepository.saveShared(conversationId, link),
    async onSettled() {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.conversations }),
        cache.invalidateQueries({ key: queryKeys.saved }),
      ]);
    },
  });
}

export function useSavedConversations() {
  return useQuery({ key: queryKeys.saved, query: conversationRepository.listSaved });
}

import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { nameFromPrompt, shareExpiration, type ConversationPatch } from '@/domain/conversation';
import { conversationRepository } from '@/infrastructure/repositories/conversation.repository';
import { usePaginatedList } from './usePaginatedList';
import { queryKeys } from '../queryKeys';

export function useConversationList(keyword: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => [...queryKeys.conversations, 'list', toValue(keyword).trim()],
    query: (offset, limit) =>
      conversationRepository.list(toValue(keyword).trim() || undefined, offset, limit),
    placeholderData: (previous) => previous,
  });
}

export function useArchivedConversations() {
  return usePaginatedList({
    key: queryKeys.archived,
    query: (offset, limit) => conversationRepository.listArchived(offset, limit),
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
    mutation: ({ prompt, folderId }: { prompt: string; folderId?: string | null }) =>
      conversationRepository.create(nameFromPrompt(prompt), folderId),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.conversations }),
  });
}

export function useUpdateConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, patch }: { id: string; patch: ConversationPatch }) =>
      conversationRepository.update(id, patch),
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
  return usePaginatedList({
    key: queryKeys.saved,
    query: (offset, limit) => conversationRepository.listSaved(offset, limit),
  });
}

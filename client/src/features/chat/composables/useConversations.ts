import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import {
  nameFromPrompt,
  shareExpiration,
  type ConversationPatch,
} from '@/features/chat/types/conversation';
import { conversationApi } from '@/features/chat/api/conversation.api';
import { usePaginatedList } from '@/shared/composables/usePaginatedList';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useConversationList(keyword: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => [...queryKeys.conversations, 'list', toValue(keyword).trim()],
    query: (offset, limit) =>
      conversationApi.list(toValue(keyword).trim() || undefined, offset, limit),
    placeholderData: (previous) => previous,
  });
}

export function useTrashedConversations() {
  return usePaginatedList({
    key: () => queryKeys.trash,
    query: (offset, limit) => conversationApi.trash(offset, limit),
  });
}

export function useRestoreConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => conversationApi.restore(id),
    onSettled: () => {
      void cache.invalidateQueries({ key: queryKeys.trash });
      void cache.invalidateQueries({ key: queryKeys.conversations });
    },
  });
}

export function usePurgeConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => conversationApi.purge(id),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.trash }),
  });
}

export function useArchivedConversations() {
  return usePaginatedList({
    key: queryKeys.archived,
    query: (offset, limit) => conversationApi.listArchived(offset, limit),
  });
}

export function useConversation(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.conversation(toValue(id)),
    query: () => conversationApi.get(toValue(id)),
  });
}

export function useCreateConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ prompt, folderId }: { prompt: string; folderId?: string | null }) =>
      conversationApi.create(nameFromPrompt(prompt), folderId),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.conversations }),
  });
}

export function useUpdateConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, patch }: { id: string; patch: ConversationPatch }) =>
      conversationApi.update(id, patch),
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
    mutation: (id: string) => conversationApi.remove(id),
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
    mutation: (days: number | null) => conversationApi.share(toValue(id), shareExpiration(days)),
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutation: () => conversationApi.revokeShare(toValue(id)),
    onSettled: refresh,
  });
  return { share, revoke };
}

export function useSharedConversation(link: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.shared(toValue(link)),
    query: () => conversationApi.getShared(toValue(link)),
  });
}

export function useSaveSharedConversation() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ conversationId, link }: { conversationId: string; link: string }) =>
      conversationApi.saveShared(conversationId, link),
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
    query: (offset, limit) => conversationApi.listSaved(offset, limit),
  });
}

import { toValue, type MaybeRefOrGetter } from 'vue';
import { messageApi } from '@/features/chat/api/message.api';
import { usePaginatedList } from '@/shared/composables/usePaginatedList';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useMessageList(conversationId: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => queryKeys.messages(toValue(conversationId)),
    query: (offset, limit) => messageApi.list(toValue(conversationId), offset, limit),
  });
}

export function useMessageSearch(
  conversationId: MaybeRefOrGetter<string>,
  keyword: MaybeRefOrGetter<string>,
) {
  return usePaginatedList({
    key: () => queryKeys.messageSearch(toValue(conversationId), toValue(keyword).trim()),
    query: (offset, limit) =>
      messageApi.search(toValue(conversationId), toValue(keyword).trim(), offset, limit),
    enabled: () => toValue(keyword).trim().length > 0,
  });
}

export function useGlobalMessageSearch(keyword: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => queryKeys.globalSearch(toValue(keyword).trim()),
    query: (offset, limit) => messageApi.searchAll(toValue(keyword).trim(), offset, limit),
    enabled: () => toValue(keyword).trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

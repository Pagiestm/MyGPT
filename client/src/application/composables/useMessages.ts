import { toValue, type MaybeRefOrGetter } from 'vue';
import { messageRepository } from '@/infrastructure/repositories/message.repository';
import { usePaginatedList } from './usePaginatedList';
import { queryKeys } from '../queryKeys';

export function useMessageList(conversationId: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => queryKeys.messages(toValue(conversationId)),
    query: (offset, limit) => messageRepository.list(toValue(conversationId), offset, limit),
  });
}

export function useMessageSearch(
  conversationId: MaybeRefOrGetter<string>,
  keyword: MaybeRefOrGetter<string>,
) {
  return usePaginatedList({
    key: () => queryKeys.messageSearch(toValue(conversationId), toValue(keyword).trim()),
    query: (offset, limit) =>
      messageRepository.search(toValue(conversationId), toValue(keyword).trim(), offset, limit),
    enabled: () => toValue(keyword).trim().length > 0,
  });
}

export function useGlobalMessageSearch(keyword: MaybeRefOrGetter<string>) {
  return usePaginatedList({
    key: () => queryKeys.globalSearch(toValue(keyword).trim()),
    query: (offset, limit) => messageRepository.searchAll(toValue(keyword).trim(), offset, limit),
    enabled: () => toValue(keyword).trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

import { toValue, type MaybeRefOrGetter } from 'vue';
import { useQuery } from '@pinia/colada';
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

export function useGlobalMessageSearch(keyword: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => queryKeys.globalSearch(toValue(keyword).trim()),
    query: () => messageRepository.searchAll(toValue(keyword).trim()),
    enabled: () => toValue(keyword).trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { knowledgeApi } from '@/features/knowledge/api/knowledge.api';
import { usePaginatedList } from '@/shared/composables/usePaginatedList';
import { queryKeys } from '@/shared/lib/queryKeys';
import { MIN_SEARCH_LENGTH } from '../types';

export function useDocuments(folderId?: MaybeRefOrGetter<string | undefined>) {
  return usePaginatedList({
    key: () => queryKeys.knowledge(toValue(folderId)),
    query: (offset, limit) => knowledgeApi.list(toValue(folderId), offset, limit),
  });
}

export function useKnowledgeSearch(
  keyword: MaybeRefOrGetter<string>,
  folderId?: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    key: () => queryKeys.knowledgeSearch(toValue(keyword), toValue(folderId)),
    query: () => knowledgeApi.search(toValue(keyword).trim(), toValue(folderId)),
    enabled: () => toValue(keyword).trim().length >= MIN_SEARCH_LENGTH,
    placeholderData: () => [],
  });
}

export function useUploadDocument() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ file, folderId }: { file: File; folderId?: string }) =>
      knowledgeApi.upload(file, folderId),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.knowledgeRoot }),
  });
}

export function useDeleteDocument() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => knowledgeApi.remove(id),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.knowledgeRoot }),
  });
}

import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQueryCache } from '@pinia/colada';
import { knowledgeApi } from '@/features/knowledge/api/knowledge.api';
import { usePaginatedList } from '@/shared/composables/usePaginatedList';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useDocuments(folderId?: MaybeRefOrGetter<string | undefined>) {
  return usePaginatedList({
    key: () => queryKeys.knowledge(toValue(folderId)),
    query: (offset, limit) => knowledgeApi.list(toValue(folderId), offset, limit),
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

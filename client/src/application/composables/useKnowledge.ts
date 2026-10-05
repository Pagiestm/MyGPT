import { toValue, type MaybeRefOrGetter } from 'vue';
import { useMutation, useQueryCache } from '@pinia/colada';
import { knowledgeRepository } from '@/infrastructure/repositories/knowledge.repository';
import { usePaginatedList } from './usePaginatedList';
import { queryKeys } from '../queryKeys';

export function useDocuments(folderId?: MaybeRefOrGetter<string | undefined>) {
  return usePaginatedList({
    key: () => queryKeys.knowledge(toValue(folderId)),
    query: (offset, limit) => knowledgeRepository.list(toValue(folderId), offset, limit),
  });
}

export function useUploadDocument() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ file, folderId }: { file: File; folderId?: string }) =>
      knowledgeRepository.upload(file, folderId),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.knowledgeRoot }),
  });
}

export function useDeleteDocument() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => knowledgeRepository.remove(id),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.knowledgeRoot }),
  });
}

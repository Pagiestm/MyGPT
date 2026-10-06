import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { FolderInput } from '../types';
import { folderApi } from '@/features/folders/api/folder.api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useFolders() {
  return useQuery({ key: queryKeys.folders, query: folderApi.list });
}

export function useSaveFolder() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, input }: { id?: string; input: FolderInput }) =>
      id ? folderApi.update(id, input) : folderApi.create(input),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.folders }),
  });
}

export function useDeleteFolder() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => folderApi.remove(id),
    async onSettled() {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.folders }),
        cache.invalidateQueries({ key: queryKeys.conversations }),
      ]);
    },
  });
}

import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { FolderInput } from '@/domain/folder';
import { folderRepository } from '@/infrastructure/repositories/folder.repository';
import { queryKeys } from '../queryKeys';

export function useFolders() {
  return useQuery({ key: queryKeys.folders, query: folderRepository.list });
}

export function useSaveFolder() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, input }: { id?: string; input: FolderInput }) =>
      id ? folderRepository.update(id, input) : folderRepository.create(input),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.folders }),
  });
}

export function useDeleteFolder() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => folderRepository.remove(id),
    async onSettled() {
      await Promise.all([
        cache.invalidateQueries({ key: queryKeys.folders }),
        cache.invalidateQueries({ key: queryKeys.conversations }),
      ]);
    },
  });
}

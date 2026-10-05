import { computed } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { AiModels } from '@/domain/ai';
import { modelsRepository, type ModelInput } from '@/infrastructure/repositories/models.repository';
import { webllmRepository } from '@/infrastructure/repositories/webllm.repository';
import { queryKeys } from '../queryKeys';

export function useModels() {
  const catalog = useQuery({
    key: queryKeys.models,
    query: modelsRepository.list,
    staleTime: 60_000,
  });

  const models = computed(() => catalog.data.value?.models ?? []);

  const data = computed<AiModels | undefined>(() =>
    catalog.data.value
      ? { models: models.value, defaultModel: models.value[0]?.id ?? '' }
      : undefined,
  );

  return {
    ...catalog,
    data,
    models,
    canManage: computed(() => catalog.data.value?.canManage ?? false),
    supported: webllmRepository.isSupported(),
  };
}

export function useAllModels() {
  return useQuery({ key: queryKeys.allModels, query: modelsRepository.all });
}

export function useDownloadedModels() {
  const { models } = useModels();
  return useQuery({
    key: () => [...queryKeys.downloadedModels, models.value.map((item) => item.id).join(',')],
    query: () => webllmRepository.withCacheState(models.value),
    staleTime: 60_000,
  });
}

function invalidateCatalog(cache: ReturnType<typeof useQueryCache>) {
  return Promise.all([
    cache.invalidateQueries({ key: queryKeys.models }),
    cache.invalidateQueries({ key: queryKeys.allModels }),
    cache.invalidateQueries({ key: queryKeys.downloadedModels }),
  ]);
}

export function useSaveModel() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, input }: { id?: string; input: ModelInput }) =>
      id ? modelsRepository.update(id, input) : modelsRepository.create(input),
    onSettled: () => invalidateCatalog(cache),
  });
}

export function useRefreshModelWeights() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => modelsRepository.update(id, { refreshWeights: true }),
    onSettled: () => invalidateCatalog(cache),
  });
}

export function useDeleteModel() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => modelsRepository.remove(id),
    onSettled: () => invalidateCatalog(cache),
  });
}

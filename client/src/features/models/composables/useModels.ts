import { computed } from 'vue';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { AiModels } from '../types/ai';
import { modelsApi, type ModelInput } from '@/features/models/api/models.api';
import { webllm } from '../api/webllm';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useModels() {
  const catalog = useQuery({
    key: queryKeys.models,
    query: modelsApi.list,
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
    supported: webllm.isSupported(),
  };
}

export function useAllModels() {
  return useQuery({ key: queryKeys.allModels, query: modelsApi.all });
}

export function useDownloadedModels() {
  const { models } = useModels();
  return useQuery({
    key: () => [...queryKeys.downloadedModels, models.value.map((item) => item.id).join(',')],
    query: () => webllm.withCacheState(models.value),
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
      id ? modelsApi.update(id, input) : modelsApi.create(input),
    onSettled: () => invalidateCatalog(cache),
  });
}

export function useRefreshModelWeights() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => modelsApi.update(id, { refreshWeights: true }),
    onSettled: () => invalidateCatalog(cache),
  });
}

export function useDeleteModel() {
  const cache = useQueryCache();
  return useMutation({
    mutation: (id: string) => modelsApi.remove(id),
    onSettled: () => invalidateCatalog(cache),
  });
}

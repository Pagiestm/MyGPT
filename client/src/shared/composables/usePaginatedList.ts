import { computed, ref, watch, type Ref } from 'vue';
import { useQuery, type UseQueryOptions } from '@pinia/colada';
import { PAGE_SIZE, type Page } from '@/shared/types/pagination';

export function usePaginatedList<T>(options: {
  key: UseQueryOptions<Page<T>>['key'];
  query: (offset: number, limit: number) => Promise<Page<T>>;
  enabled?: UseQueryOptions<Page<T>>['enabled'];
  placeholderData?: UseQueryOptions<Page<T>>['placeholderData'];
}) {
  const extra = ref<T[]>([]) as Ref<T[]>;
  const nextOffset = ref(0);
  const exhausted = ref(false);
  const loadingMore = ref(false);

  const first = useQuery<Page<T>>({
    key: options.key,
    query: () => options.query(0, PAGE_SIZE),
    ...(options.enabled ? { enabled: options.enabled } : {}),
    ...(options.placeholderData ? { placeholderData: options.placeholderData } : {}),
  });

  watch(
    () => first.data.value,
    (page) => {
      extra.value = [];
      nextOffset.value = page?.items.length ?? 0;
      exhausted.value = !page?.hasMore;
    },
  );

  const items = computed(() => [...(first.data.value?.items ?? []), ...extra.value]);
  const total = computed(() => first.data.value?.total ?? 0);
  const hasMore = computed(() => !exhausted.value && items.value.length < total.value);

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    try {
      const page = await options.query(nextOffset.value, PAGE_SIZE);
      extra.value = [...extra.value, ...page.items];
      nextOffset.value += page.items.length;
      exhausted.value = !page.hasMore || page.items.length === 0;
    } finally {
      loadingMore.value = false;
    }
  }

  return {
    ...first,
    items,
    total,
    hasMore,
    loadMore,
    loadingMore: computed(() => loadingMore.value),
  };
}

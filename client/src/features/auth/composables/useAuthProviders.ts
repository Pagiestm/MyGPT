import { useQuery } from '@pinia/colada';
import { computed } from 'vue';
import { authApi } from '../api/auth.api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useAuthProviders() {
  const { data } = useQuery({ key: queryKeys.authProviders, query: authApi.providers });

  return { google: computed(() => data.value?.google === true) };
}

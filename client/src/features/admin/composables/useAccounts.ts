import { useMutation, useQueryCache } from '@pinia/colada';
import type { UserRole } from '@/shared/types/user';
import { accountApi } from '@/features/admin/api/account.api';
import { usePaginatedList } from '@/shared/composables/usePaginatedList';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useAccounts() {
  return usePaginatedList({
    key: queryKeys.accounts,
    query: (offset, limit) => accountApi.list(offset, limit),
  });
}

export function useUpdateRole() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, role }: { id: string; role: UserRole }) => accountApi.updateRole(id, role),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.accounts }),
  });
}

import { useMutation, useQueryCache } from '@pinia/colada';
import type { UserRole } from '@/domain/user';
import { accountRepository } from '@/infrastructure/repositories/account.repository';
import { usePaginatedList } from './usePaginatedList';
import { queryKeys } from '../queryKeys';

export function useAccounts() {
  return usePaginatedList({
    key: queryKeys.accounts,
    query: (offset, limit) => accountRepository.list(offset, limit),
  });
}

export function useUpdateRole() {
  const cache = useQueryCache();
  return useMutation({
    mutation: ({ id, role }: { id: string; role: UserRole }) =>
      accountRepository.updateRole(id, role),
    onSettled: () => cache.invalidateQueries({ key: queryKeys.accounts }),
  });
}

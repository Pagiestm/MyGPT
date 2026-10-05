import { http } from '../http/client';
import type { AccountSummary, UserRole } from '@/domain/user';
import { PAGE_SIZE, type Page } from '@/domain/pagination';

export const accountRepository = {
  list: (offset = 0, limit = PAGE_SIZE) =>
    http.get<Page<AccountSummary>>('/users', { params: { offset, limit } }).then((r) => r.data),

  updateRole: (id: string, role: UserRole) =>
    http.patch<AccountSummary>(`/users/${id}/role`, { role }).then((r) => r.data),
};

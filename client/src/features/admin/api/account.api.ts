import { http } from '@/shared/lib/http';
import type { AccountSummary, UserRole } from '@/shared/types/user';
import { PAGE_SIZE, type Page } from '@/shared/types/pagination';

export const accountApi = {
  list: (offset = 0, limit = PAGE_SIZE) =>
    http.get<Page<AccountSummary>>('/users', { params: { offset, limit } }).then((r) => r.data),

  updateRole: (id: string, role: UserRole) =>
    http.patch<AccountSummary>(`/users/${id}/role`, { role }).then((r) => r.data),
};

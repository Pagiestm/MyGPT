import { http } from '@/shared/lib/http';
import type { Credentials, Registration, User } from '@/shared/types/user';

export const authApi = {
  providers: () => http.get<{ google: boolean }>('/auth/providers').then((r) => r.data),

  login: (input: Credentials) => http.post('/auth/login', input),
  logout: () => http.post('/auth/logout'),
  register: (input: Registration) => http.post('/users/register', input),
  me: () => http.get<User>('/auth/profile').then((r) => r.data),
};

import { http } from '../http/client';
import type { LoginInput, RegisterInput, User } from '@/domain/user';

export const authRepository = {
  login: (input: LoginInput) => http.post('/auth/login', input),
  logout: () => http.post('/auth/logout'),
  register: (input: RegisterInput) => http.post('/users/register', input),
  me: () => http.get<User>('/auth/profile').then((r) => r.data),
};

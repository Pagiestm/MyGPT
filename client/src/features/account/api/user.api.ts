import { http } from '@/shared/lib/http';

export const userApi = {
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    http.patch('/users/profile/password', input).then(() => undefined),

  changeEmail: (input: { email: string; password: string }) =>
    http.patch<{ email: string }>('/users/profile/email', input).then((r) => r.data),

  forgotPassword: (email: string) =>
    http.post<{ message: string }>('/users/password/forgot', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    http.post('/users/password/reset', { token, password }).then(() => undefined),

  recovery: () => http.get<{ byEmail: boolean }>('/users/password/recovery').then((r) => r.data),

  updatePseudo: (pseudo: string) => http.patch('/users/profile/pseudo', { pseudo }),
  deleteAccount: () => http.delete('/users/profile'),
  updatePreferences: (input: { customInstructions?: string; preferredModel?: string | null }) =>
    http.patch('/users/profile/preferences', input),
};

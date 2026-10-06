import { http } from '@/shared/lib/http';

export const userApi = {
  updatePseudo: (pseudo: string) => http.patch('/users/profile/pseudo', { pseudo }),
  deleteAccount: () => http.delete('/users/profile'),
  updatePreferences: (input: { customInstructions?: string; preferredModel?: string | null }) =>
    http.patch('/users/profile/preferences', input),
};

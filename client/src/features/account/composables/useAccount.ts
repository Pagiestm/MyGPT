import { useMutation } from '@pinia/colada';
import type { PreferencesInput } from '../types';
import { userApi } from '@/features/account/api/user.api';
import { useAuthStore } from '@/features/auth';

export function useUpdatePseudo() {
  const auth = useAuthStore();
  return useMutation({
    mutation: (pseudo: string) => userApi.updatePseudo(pseudo),
    onSuccess: () => auth.fetchUser(),
  });
}

export function useUpdatePreferences() {
  const auth = useAuthStore();
  return useMutation({
    mutation: (input: PreferencesInput) => userApi.updatePreferences(input),
    onSuccess: () => auth.fetchUser(),
  });
}

export function useDeleteAccount() {
  const auth = useAuthStore();
  return useMutation({
    mutation: () => userApi.deleteAccount(),
    onSuccess: () => auth.clear(),
  });
}

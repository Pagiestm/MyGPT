import { useMutation } from '@pinia/colada';
import type { PreferencesInput } from '@/domain/user';
import { userRepository } from '@/infrastructure/repositories/user.repository';
import { useAuthStore } from '../stores/auth.store';

export function useUpdatePseudo() {
  const auth = useAuthStore();
  return useMutation({
    mutation: (pseudo: string) => userRepository.updatePseudo(pseudo),
    onSuccess: () => auth.fetchUser(),
  });
}

export function useUpdatePreferences() {
  const auth = useAuthStore();
  return useMutation({
    mutation: (input: PreferencesInput) => userRepository.updatePreferences(input),
    onSuccess: () => auth.fetchUser(),
  });
}

export function useDeleteAccount() {
  const auth = useAuthStore();
  return useMutation({
    mutation: () => userRepository.deleteAccount(),
    onSuccess: () => auth.clear(),
  });
}

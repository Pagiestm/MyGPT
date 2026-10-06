import { computed } from 'vue';
import { useMutation, useQuery } from '@pinia/colada';
import type { PreferencesInput } from '../types';
import { userApi } from '@/features/account/api/user.api';
import { useAuthStore } from '@/features/auth';
import { queryKeys } from '@/shared/lib/queryKeys';

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

export function useChangePassword() {
  return useMutation({ mutation: userApi.changePassword });
}

export function useChangeEmail() {
  const auth = useAuthStore();
  return useMutation({
    mutation: userApi.changeEmail,
    onSuccess: () => auth.fetchUser(),
  });
}

export function useForgotPassword() {
  return useMutation({ mutation: userApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({
    mutation: ({ token, password }: { token: string; password: string }) =>
      userApi.resetPassword(token, password),
  });
}

export function usePasswordRecovery() {
  const { data } = useQuery({ key: queryKeys.passwordRecovery, query: userApi.recovery });
  return { byEmail: computed(() => data.value?.byEmail === true) };
}

export function useDeleteAccount() {
  const auth = useAuthStore();
  return useMutation({
    mutation: () => userApi.deleteAccount(),
    onSuccess: () => auth.clear(),
  });
}

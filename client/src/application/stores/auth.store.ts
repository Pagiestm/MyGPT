import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useQueryCache } from '@pinia/colada';
import type { LoginInput, RegisterInput, User } from '@/domain/user';
import { authRepository } from '@/infrastructure/repositories/auth.repository';

export const useAuthStore = defineStore('auth', () => {
  const queryCache = useQueryCache();
  const user = ref<User | null>(null);
  let session: Promise<void> | undefined;

  const isAuthenticated = computed(() => user.value !== null);

  async function fetchUser() {
    try {
      user.value = await authRepository.me();
    } catch {
      user.value = null;
    }
  }

  function ensureSession() {
    session ??= fetchUser();
    return session;
  }

  async function login(input: LoginInput) {
    await authRepository.login(input);
    queryCache.getEntries().forEach((entry) => queryCache.remove(entry));
    await fetchUser();
  }

  function register(input: RegisterInput) {
    return authRepository.register(input);
  }

  function clear() {
    user.value = null;
  }

  async function logout() {
    try {
      await authRepository.logout();
    } finally {
      clear();
    }
  }

  return { user, isAuthenticated, ensureSession, fetchUser, login, register, logout, clear };
});

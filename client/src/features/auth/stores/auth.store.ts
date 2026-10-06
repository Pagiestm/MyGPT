import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useQueryCache } from '@pinia/colada';
import type { Credentials, Registration, User } from '@/shared/types/user';
import { authApi } from '../api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const queryCache = useQueryCache();
  const user = ref<User | null>(null);
  let session: Promise<void> | undefined;

  const isAuthenticated = computed(() => user.value !== null);

  async function fetchUser() {
    try {
      user.value = await authApi.me();
    } catch {
      user.value = null;
    }
  }

  function ensureSession() {
    session ??= fetchUser();
    return session;
  }

  async function login(input: Credentials) {
    await authApi.login(input);
    queryCache.getEntries().forEach((entry) => queryCache.remove(entry));
    await fetchUser();
  }

  function register(input: Registration) {
    return authApi.register(input);
  }

  function clear() {
    user.value = null;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }

  return { user, isAuthenticated, ensureSession, fetchUser, login, register, logout, clear };
});

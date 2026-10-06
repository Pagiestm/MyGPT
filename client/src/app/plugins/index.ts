import type { App } from 'vue';
import { createPinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import ui from '@nuxt/ui/vue-plugin';
import { router } from '../router';
import { onUnauthorized } from '@/shared/lib/http';
import { useAuthStore } from '@/features/auth';

export function registerPlugins(app: App) {
  app.use(createPinia());
  app.use(PiniaColada, { queryOptions: { staleTime: 30_000, refetchOnWindowFocus: false } });
  app.use(router);
  app.use(ui);

  onUnauthorized(() => {
    const auth = useAuthStore();
    if (!auth.isAuthenticated) return;
    auth.clear();
    if (router.currentRoute.value.meta.requiresAuth) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    }
  });
}

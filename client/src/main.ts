import './assets/css/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import ui from '@nuxt/ui/vue-plugin';
import App from './App.vue';
import { router } from './presentation/router';
import { onUnauthorized } from './infrastructure/http/client';
import { useAuthStore } from './application/stores/auth.store';

const app = createApp(App);

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

app.mount('#app');

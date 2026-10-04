import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/application/stores/auth.store';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.ensureSession();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : { name: 'new-chat' };
  }
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · MyGPT` : 'MyGPT, votre assistant IA';
});

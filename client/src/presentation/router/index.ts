import { createRouter, createWebHistory } from 'vue-router';
import { isAdmin } from '@/domain/user';
import { useAuthStore } from '@/application/stores/auth.store';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from) => {
    if (to.hash.startsWith('#message-')) return false;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return to.path === from.path ? false : { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.ensureSession();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !isAdmin(auth.user)) {
    return { name: 'new-chat' };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : { name: 'new-chat' };
  }
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · MyGPT` : 'MyGPT, votre assistant IA';
});

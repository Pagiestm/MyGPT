import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/application/stores/auth.store';
import { routes } from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from) => {
    // Les ancres de message (#message-…) sont gérées par la vue de conversation
    if (to.hash.startsWith('#message-')) return false;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    // Retrait de l'ancre sur la même page : on garde la position
    return to.path === from.path ? false : { top: 0 };
  },
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

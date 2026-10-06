import type { RouteRecordRaw } from 'vue-router';

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/HomePage.vue'),
  },
];

export const notFoundRoute: RouteRecordRaw = {
  path: '/:path(.*)*',
  name: 'not-found',
  component: () => import('./pages/NotFoundPage.vue'),
  meta: { title: 'Page introuvable' },
};

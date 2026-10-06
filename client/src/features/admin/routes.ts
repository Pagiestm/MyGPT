import type { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/AdminPage.vue'),
    meta: { layout: 'app', requiresAuth: true, requiresAdmin: true, title: 'Administration' },
  },
];

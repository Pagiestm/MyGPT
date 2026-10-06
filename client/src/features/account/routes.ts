import type { RouteRecordRaw } from 'vue-router';

export const accountRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./pages/SettingsPage.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Réglages' },
  },

  { path: '/profile', redirect: { name: 'settings' } },
];

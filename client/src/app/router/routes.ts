import type { RouteRecordRaw } from 'vue-router';
import { accountRoutes } from '@/features/account/routes';
import { adminRoutes } from '@/features/admin/routes';
import { authRoutes } from '@/features/auth/routes';
import { chatRoutes } from '@/features/chat/routes';
import { homeRoutes, notFoundRoute } from '@/features/home/routes';

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'marketing' | 'auth' | 'app';
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    guestOnly?: boolean;
    title?: string;
  }
}

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...authRoutes,
  ...chatRoutes,
  ...accountRoutes,
  ...adminRoutes,
  notFoundRoute,
];

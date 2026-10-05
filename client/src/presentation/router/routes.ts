import type { RouteRecordRaw } from 'vue-router';

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
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'Connexion' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'Inscription' },
  },
  {
    path: '/chat',
    name: 'new-chat',
    component: () => import('../views/NewChatView.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Nouvelle conversation' },
  },
  {
    path: '/chat/:id',
    name: 'conversation',
    component: () => import('../views/ConversationView.vue'),
    props: true,
    meta: { layout: 'app', requiresAuth: true, title: 'Conversation' },
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Bibliothèque' },
  },
  {
    path: '/archives',
    name: 'archives',
    component: () => import('../views/ArchivesView.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Archives' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Réglages' },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { layout: 'app', requiresAuth: true, requiresAdmin: true, title: 'Administration' },
  },
  {
    path: '/s/:link',
    name: 'shared-conversation',
    component: () => import('../views/SharedConversationView.vue'),
    props: true,
    meta: { title: 'Conversation partagée' },
  },

  { path: '/profile', redirect: { name: 'settings' } },
  { path: '/chat/saved', redirect: { name: 'library' } },
  {
    path: '/chat/shared/:link',
    redirect: (to) => ({ name: 'shared-conversation', params: { link: to.params.link } }),
  },

  {
    path: '/:path(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Page introuvable' },
  },
];

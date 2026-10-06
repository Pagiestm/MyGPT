import type { RouteRecordRaw } from 'vue-router';

export const chatRoutes: RouteRecordRaw[] = [
  {
    path: '/chat',
    name: 'new-chat',
    component: () => import('./pages/NewChatPage.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Nouvelle conversation' },
  },
  {
    path: '/chat/:id',
    name: 'conversation',
    component: () => import('./pages/ConversationPage.vue'),
    props: true,
    meta: { layout: 'app', requiresAuth: true, title: 'Conversation' },
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('./pages/LibraryPage.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Bibliothèque' },
  },
  {
    path: '/archives',
    name: 'archives',
    component: () => import('./pages/ArchivesPage.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Archives' },
  },
  {
    path: '/corbeille',
    name: 'trash',
    component: () => import('./pages/TrashPage.vue'),
    meta: { layout: 'app', requiresAuth: true, title: 'Corbeille' },
  },
  {
    path: '/s/:link',
    name: 'shared-conversation',
    component: () => import('./pages/SharedConversationPage.vue'),
    props: true,
    meta: { title: 'Conversation partagée' },
  },

  { path: '/chat/saved', redirect: { name: 'library' } },
  {
    path: '/chat/shared/:link',
    redirect: (to) => ({ name: 'shared-conversation', params: { link: to.params.link } }),
  },
];

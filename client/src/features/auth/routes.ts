import type { RouteRecordRaw } from 'vue-router';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'Connexion' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./pages/RegisterPage.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'Inscription' },
  },
  {
    path: '/mot-de-passe-oublie',
    name: 'forgot-password',
    component: () => import('./pages/ForgotPasswordPage.vue'),
    meta: { layout: 'auth', guestOnly: true, title: 'Mot de passe oublié' },
  },
  {
    path: '/reinitialiser/:token',
    name: 'reset-password',
    component: () => import('./pages/ResetPasswordPage.vue'),
    props: true,
    meta: { layout: 'auth', guestOnly: true, title: 'Nouveau mot de passe' },
  },
];

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { title: 'Accueil' }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/Login.vue'),
        meta: {
            title: 'Connexion',
            guestOnly: true
        }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/auth/Register.vue'),
        meta: {
            title: 'Inscription',
            guestOnly: true
        }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/auth/Profile.vue'),
        meta: {
            title: 'Mon profil',
            requiresAuth: true
        }
    }
];

export default routes;

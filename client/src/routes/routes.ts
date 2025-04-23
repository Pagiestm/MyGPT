import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: {
            title: 'Accueil',
            layout: 'default'
        }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/Login.vue'),
        meta: {
            title: 'Connexion',
            layout: 'default',
            guestOnly: true
        }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/auth/Register.vue'),
        meta: {
            title: 'Inscription',
            layout: 'default',
            guestOnly: true
        }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/auth/Profile.vue'),
        meta: {
            title: 'Mon profil',
            layout: 'default',
            requiresAuth: true
        }
    },
    {
        path: '/chat',
        component: () => import('../views/chat/ChatHome.vue'),
        meta: {
            layout: 'chat',
            requiresAuth: true,
            title: 'Chat'
        }
    },
    {
        path: '/chat/saved',
        name: 'shared-conversations',
        component: () => import('../views/chat/share/SharedConversations.vue'),
        meta: {
            title: 'Conversations sauvegardées',
            layout: 'chat',
            requiresAuth: true
        }
    },
    {
        path: '/chat/shared/:shareLink',
        name: 'shared-conversation',
        component: () => import('../views/chat/share/SharedConversation.vue'),
        meta: {
            title: 'Conversation partagée',
            layout: 'chat',
            requiresAuth: true
        }
    },
    {
        path: '/chat/:id',
        name: 'ConversationDetail',
        component: () => import('../views/chat/ConversationDetail.vue'),
        meta: {
            title: 'Conversation',
            layout: 'chat',
            requiresAuth: true
        },
        props: true
    }
];

export default routes;

import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, _from, next) => {
    document.title = `${to.meta.title || 'Page'}`;

    const authStore = useAuthStore();

    // Vérification des routes protégées
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next('/login');
    }

    // Redirection si déjà connecté
    if (to.meta.guestOnly && authStore.isAuthenticated) {
        return next('/');
    }

    next();
});

export default router;

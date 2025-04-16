import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, _from, next) => {
    document.title = `${to.meta.title || 'Page'}`;

    const authStore = useAuthStore();

    // Attend que l'état soit chargé pour éviter les redirections inutiles
    if (authStore.isLoading) {
        await authStore.loadUser();
    }

    // Redirection si l'utilisateur est déjà connecté
    if (to.meta.guestOnly && authStore.isAuthenticated()) {
        return next('/');
    }

    // Redirection si la page nécessite une authentification
    if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
        return next('/login');
    }

    next();
});

export default router;

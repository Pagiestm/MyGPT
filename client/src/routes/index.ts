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
        // Si c'est une conversation partagée, rediriger vers login avec l'URL en paramètre
        if (to.path.startsWith('/chat/shared/')) {
            return next({
                path: '/login',
                query: { redirect: to.fullPath }
            });
        }
        return next('/login');
    }

    // Redirection si déjà connecté
    if (to.meta.guestOnly && authStore.isAuthenticated) {
        // Si on a un paramètre de redirection (venant d'une conversation partagée)
        const redirectPath = to.query.redirect;
        if (redirectPath) {
            return next(redirectPath.toString());
        }
        return next('/');
    }

    next();
});

export default router;

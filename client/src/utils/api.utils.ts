import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Intercepteur qui gère les erreurs d'authentification
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Si l'API renvoie 401, le cookie de session n'est plus valide
        if (error.response?.status === 401) {
            const authStore = useAuthStore();

            await authStore.logout();
        }
        return Promise.reject(error);
    }
);

export default api;

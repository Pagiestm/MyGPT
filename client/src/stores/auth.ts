import { ref } from 'vue';
import { defineStore } from 'pinia';
import Database from '../utils/database.utils';
import type { AxiosError } from 'axios';

// Interface pour les informations d'identification
interface LoginCredentials {
    email: string;
    password: string;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const error = ref<string | null>(null);
    const isLoading = ref(true);

    // Vérifie l'authentification
    const isAuthenticated = () => !!user.value;

    // Charge le profil utilisateur au démarrage
    async function loadUser() {
        isLoading.value = true;
        try {
            const data = await Database.getAll('auth/profile'); // Vérifie la session
            user.value = data || null;
        } catch (err) {
            user.value = null;
            const axiosError = err as AxiosError<{ message: string }>;
            error.value =
                axiosError.response?.data?.message ||
                'Erreur lors du chargement du profil';
        } finally {
            isLoading.value = false;
        }
    }

    async function login(credentials: LoginCredentials) {
        error.value = null;
        try {
            const result = await Database.create('auth/login', credentials);
            if (result?.data) {
                await loadUser();
                return true;
            }
            return false;
        } catch (err: unknown) {
            const axiosError = err as AxiosError<{ message: string }>;
            error.value =
                axiosError.response?.data?.message || 'Échec de connexion';
            return false;
        }
    }

    async function logout() {
        try {
            await Database.create('auth/logout', {});
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            error.value =
                axiosError.response?.data?.message ||
                'Erreur lors de la déconnexion';
            console.warn('Erreur lors de la déconnexion:', error.value);
        } finally {
            user.value = null;
        }
    }

    return {
        user,
        error,
        isLoading,
        login,
        logout,
        loadUser,
        isAuthenticated
    };
});

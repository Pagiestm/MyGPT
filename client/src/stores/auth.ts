import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import Database from '../utils/database.utils';
import type { AxiosError } from 'axios';

interface LoginCredentials {
    email: string;
    password: string;
}

export const useAuthStore = defineStore(
    'auth',
    () => {
        // État principal - stocke uniquement l'utilisateur après connexion réussie
        const user = ref(null);
        const error = ref<string | null>(null);
        const isLoading = ref(false);

        // Vérification basée uniquement sur l'existence des données utilisateur
        const isAuthenticated = computed(() => !!user.value);

        // Fonction de connexion
        async function login(credentials: LoginCredentials) {
            error.value = null;
            isLoading.value = true;

            try {
                const result = await Database.create('auth/login', credentials);
                if (result?.data?.user) {
                    // Stocke les données de l'utilisateur de la réponse de login
                    user.value = result.data.user;
                    return true;
                }
                return false;
            } catch (err) {
                const axiosError = err as AxiosError<{ message: string }>;
                error.value =
                    axiosError.response?.data?.message || 'Échec de connexion';
                return false;
            } finally {
                isLoading.value = false;
            }
        }

        // Déconnexion
        async function logout() {
            isLoading.value = true;
            try {
                await Database.create('auth/logout', {});
            } catch (err) {
                console.warn('Erreur lors de la déconnexion:', err);
            } finally {
                user.value = null;
                isLoading.value = false;
            }
        }

        return {
            user,
            error,
            isLoading,
            isAuthenticated,
            login,
            logout
        };
    },
    {
        persist: {
            key: 'auth',
            storage: localStorage,
            serializer: {
                serialize: (state) => {
                    const { error, isLoading, ...rest } = state;

                    console.debug('Propriétés non persistées:', {
                        error,
                        isLoading
                    });

                    return JSON.stringify(rest);
                },
                deserialize: (str) => JSON.parse(str)
            }
        }
    }
);

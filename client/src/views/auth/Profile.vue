<template>
    <div class="bg-gray-50 min-h-screen py-8">
        <div class="container mx-auto px-4 max-w-3xl">
            <!-- En-tête de profil -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div
                    class="bg-gradient-to-r from-indigo-500 to-indigo-600 h-20"
                ></div>
                <div class="p-6">
                    <!-- Avatar et nom d'utilisateur -->
                    <div class="flex items-center space-x-4">
                        <div
                            class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-8 w-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1
                                v-if="profile"
                                class="text-xl font-bold text-gray-800"
                            >
                                {{ profile.pseudo }}
                            </h1>
                            <p v-if="profile" class="text-sm text-gray-500">
                                {{ profile.email }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations du profil -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div class="p-6">
                    <h2
                        class="text-lg font-semibold text-gray-800 mb-4 flex items-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 mr-2 text-indigo-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        Mon profil
                    </h2>

                    <div v-if="profile" class="grid grid-cols-1 gap-4">
                        <!-- Information du pseudo avec possibilité de modification -->
                        <div
                            class="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-all duration-300"
                        >
                            <div class="flex justify-between items-center">
                                <div class="text-sm font-medium text-gray-500">
                                    Pseudo
                                </div>
                                <button
                                    v-if="!isEditingPseudo"
                                    class="text-xs text-indigo-500 hover:text-indigo-700"
                                    @click="startEditingPseudo"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <!-- Mode affichage -->
                            <div
                                v-if="!isEditingPseudo"
                                class="mt-1 text-gray-800"
                            >
                                {{ profile.pseudo }}
                            </div>

                            <!-- Mode édition -->
                            <div v-else class="mt-2">
                                <input
                                    v-model="newPseudo"
                                    type="text"
                                    class="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    :placeholder="profile.pseudo"
                                />
                                <div class="flex items-center space-x-2 mt-2">
                                    <button
                                        class="px-3 py-1 bg-indigo-500 text-white rounded-md text-xs hover:bg-indigo-600"
                                        :disabled="
                                            isUpdatingPseudo || !isPseudoValid
                                        "
                                        @click="savePseudo"
                                    >
                                        <span v-if="isUpdatingPseudo">
                                            <svg
                                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                        </span>
                                        Enregistrer
                                    </button>
                                    <button
                                        class="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300"
                                        @click="cancelEditingPseudo"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            class="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-all duration-300"
                        >
                            <div class="text-sm font-medium text-gray-500">
                                Email
                            </div>
                            <div class="mt-1 text-gray-800">
                                {{ profile.email }}
                            </div>
                        </div>
                    </div>

                    <div
                        v-else
                        class="flex items-center justify-center h-20 bg-gray-50 rounded-lg"
                    >
                        <div class="animate-pulse flex space-x-4">
                            <div class="h-4 w-20 bg-gray-200 rounded"></div>
                            <div class="h-4 w-28 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-6">
                    <h2
                        class="text-lg font-semibold text-gray-800 mb-4 flex items-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 mr-2 text-indigo-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Actions
                    </h2>
                    <div class="space-y-3">
                        <button
                            class="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors text-sm font-medium flex items-center justify-center"
                            @click="logout"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Se déconnecter
                        </button>

                        <button
                            class="w-full text-center py-2 text-xs text-red-600 hover:text-red-800 transition-colors flex items-center justify-center"
                            @click="showDeleteConfirm"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            Supprimer mon compte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de confirmation pour la suppression du compte -->
    <DeleteConfirmModal
        v-if="showDeleteConfirmModal"
        title="Supprimer votre compte"
        message="Attention ! Cette action est irréversible. La suppression de votre compte entraînera la perte de toutes vos conversations et données personnelles. Êtes-vous sûr de vouloir continuer ?"
        @confirm="deleteAccount"
        @cancel="showDeleteConfirmModal = false"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import Database from '../../utils/database.utils';
import { useToast } from 'vue-toastification';
import { User } from '../../interfaces/user.interface';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.vue';

const profile = ref<User | null>(null);
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Variables pour l'édition du pseudo
const isEditingPseudo = ref(false);
const newPseudo = ref('');
const isUpdatingPseudo = ref(false);
const pseudoError = ref('');

// Variable pour le modal de confirmation de suppression
const showDeleteConfirmModal = ref(false);
const isDeletingAccount = ref(false);

// Validation du pseudo
const isPseudoValid = computed(() => {
    return (
        newPseudo.value.length >= 3 &&
        newPseudo.value.length <= 20 &&
        newPseudo.value !== profile.value?.pseudo
    );
});

async function loadProfile() {
    try {
        const data = await Database.getAll('auth/profile');
        profile.value = data || null;
    } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        profile.value = null;
        toast.error('Impossible de charger votre profil');
    }
}

async function logout() {
    try {
        await authStore.logout();
        toast.success('Déconnexion réussie');
        router.push('/login');
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        toast.error('Erreur lors de la déconnexion');
    }
}

// Fonction pour afficher le modal de confirmation
function showDeleteConfirm() {
    showDeleteConfirmModal.value = true;
}

// Fonction pour supprimer le compte
async function deleteAccount() {
    if (isDeletingAccount.value) return;

    try {
        isDeletingAccount.value = true;

        await Database.delete('users/profile');

        // Déconnexion après suppression du compte
        await authStore.logout();

        // Notification et redirection
        toast.success('Votre compte a été supprimé avec succès');
        router.push('/');
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        toast.error('Une erreur est survenue lors de la suppression du compte');
        showDeleteConfirmModal.value = false;
    } finally {
        isDeletingAccount.value = false;
    }
}

// Fonction pour commencer l'édition du pseudo
function startEditingPseudo() {
    if (!profile.value) return;
    newPseudo.value = profile.value.pseudo;
    isEditingPseudo.value = true;
    pseudoError.value = '';
}

// Fonction pour annuler l'édition du pseudo
function cancelEditingPseudo() {
    isEditingPseudo.value = false;
    newPseudo.value = '';
    pseudoError.value = '';
}

// Fonction pour sauvegarder le nouveau pseudo
async function savePseudo() {
    if (!profile.value || !isPseudoValid.value) return;

    try {
        isUpdatingPseudo.value = true;
        pseudoError.value = '';

        const response = await Database.patch('users/profile/pseudo', {
            pseudo: newPseudo.value
        });

        if (response && response.message) {
            profile.value.pseudo = newPseudo.value;
            toast.success('Votre pseudo a été mis à jour');
            isEditingPseudo.value = false;
        }
    } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour du pseudo:', error);

        // Définir un type pour l'erreur avec une structure attendue
        interface ApiError {
            response?: {
                status: number;
                data?: {
                    message?: string;
                };
            };
            message?: string;
        }

        // Extraire les messages d'erreur avec un typage approprié
        const apiError = error as ApiError;

        if (apiError.response && apiError.response.data) {
            if (apiError.response.status === 409) {
                pseudoError.value = 'Ce pseudo est déjà utilisé';
            } else if (apiError.response.data.message) {
                pseudoError.value = apiError.response.data.message;
            } else {
                pseudoError.value =
                    'Une erreur est survenue lors de la modification du pseudo';
            }
        } else {
            pseudoError.value =
                'Une erreur est survenue lors de la modification du pseudo';
        }

        toast.error(pseudoError.value);
    } finally {
        isUpdatingPseudo.value = false;
    }
}

onMounted(() => {
    loadProfile();
});
</script>

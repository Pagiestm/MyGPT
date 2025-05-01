<template>
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <nav
            class="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center"
        >
            <!-- Logo -->
            <div class="flex-shrink-0">
                <router-link to="/" class="flex items-center">
                    <div
                        class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md mr-2"
                    >
                        <span class="text-white font-bold text-xl">M</span>
                    </div>
                    <span
                        class="font-bold text-xl bg-gradient-to-r from-indigo-500 to-indigo-600 inline-block text-transparent bg-clip-text"
                    >
                        MyGPT
                    </span>
                </router-link>
            </div>

            <!-- Navigation Desktop -->
            <div class="hidden md:flex items-center space-x-1">
                <router-link
                    to="/"
                    class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    active-class="bg-indigo-50 text-indigo-700"
                >
                    Accueil
                </router-link>
                <router-link
                    v-if="authStore.isAuthenticated"
                    to="/chat"
                    class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    active-class="bg-indigo-50 text-indigo-700"
                >
                    Chat
                </router-link>
            </div>

            <!-- Authentication -->
            <div class="flex items-center space-x-2">
                <template v-if="authStore.isAuthenticated">
                    <!-- Menu de profil avec ouverture au clic -->
                    <div
                        ref="profileMenuContainer"
                        class="hidden md:block relative"
                    >
                        <button
                            class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            @click.stop="toggleProfileMenu"
                        >
                            <span>Mon compte</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 transition-transform duration-200"
                                :class="{ 'rotate-180': profileMenuOpen }"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        <!-- Menu déroulant simplifié -->
                        <div
                            v-show="profileMenuOpen"
                            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-100"
                        >
                            <router-link
                                to="/profile"
                                class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                <div class="flex items-center">
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
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    Mon profil
                                </div>
                            </router-link>
                            <button
                                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                @click="logout"
                            >
                                <div class="flex items-center">
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
                                    Déconnexion
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Version mobile -->
                    <div class="md:hidden flex space-x-1">
                        <router-link
                            to="/profile"
                            class="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                            active-class="bg-indigo-50 text-indigo-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
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
                        </router-link>
                        <router-link
                            to="/chat"
                            class="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                            active-class="bg-indigo-50 text-indigo-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                        </router-link>
                        <button
                            class="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50"
                            @click="logout"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
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
                        </button>
                    </div>
                </template>

                <template v-else>
                    <router-link
                        to="/login"
                        class="hidden md:flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                        </svg>
                        Connexion
                    </router-link>

                    <router-link
                        to="/login"
                        class="md:hidden p-2 rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                        </svg>
                    </router-link>
                </template>
            </div>
        </nav>
    </header>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();
const profileMenuOpen = ref(false);
const profileMenuContainer = ref<HTMLElement | null>(null);

function toggleProfileMenu() {
    profileMenuOpen.value = !profileMenuOpen.value;
}

// Ferme le menu si on clique ailleurs sur la page
function handleClickOutside(event: MouseEvent) {
    if (
        profileMenuOpen.value &&
        profileMenuContainer.value &&
        !profileMenuContainer.value.contains(event.target as Node)
    ) {
        profileMenuOpen.value = false;
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside);
});

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
</script>

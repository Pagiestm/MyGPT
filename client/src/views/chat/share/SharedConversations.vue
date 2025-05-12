<template>
    <div class="min-h-screen bg-gray-50">
        <LoadingOverlay
            class="px-4"
            :show="isLoading"
            message="Chargement des conversations..."
        />

        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <button
                            class="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 mr-3"
                            @click="toggleSidebar"
                        >
                            <i class="fas fa-bars"></i>
                        </button>
                        <div>
                            <h1
                                class="text-md md:text-xl font-bold text-gray-900"
                            >
                                Conversations sauvegardées
                            </h1>
                            <p class="text-xs text-gray-500 mt-1">
                                Les conversations partagées que vous avez
                                sauvegardées
                            </p>
                        </div>
                    </div>

                    <!-- Ajout des icônes de navigation -->
                    <div class="flex items-center space-x-1 md:space-x-3">
                        <!-- Menu mobile -->
                        <div class="relative md:hidden">
                            <button
                                class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                                data-mobile-menu-button
                                @click="showMobileMenu = !showMobileMenu"
                            >
                                <i class="fas fa-ellipsis-v"></i>
                            </button>

                            <!-- Menu dropdown mobile -->
                            <div
                                v-if="showMobileMenu"
                                class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200"
                                data-mobile-menu-content
                            >
                                <router-link
                                    to="/"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-500"
                                >
                                    <i class="fas fa-home mr-2"></i> Accueil
                                </router-link>
                                <router-link
                                    to="/profile"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-500"
                                >
                                    <i class="fas fa-user mr-2"></i> Mon profil
                                </router-link>
                            </div>
                        </div>

                        <!-- Boutons de navigation - visibles sur tablette/desktop -->
                        <div
                            class="hidden md:flex items-center space-x-1 md:space-x-3"
                        >
                            <router-link
                                to="/"
                                class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                                title="Accueil"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="w-5 h-5"
                                >
                                    <path
                                        d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"
                                    />
                                    <path
                                        d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"
                                    />
                                </svg>
                            </router-link>

                            <router-link
                                to="/profile"
                                class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                                title="Mon profil"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="w-5 h-5"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Contenu principal -->
            <div class="bg-white shadow overflow-hidden rounded-lg">
                <!-- Liste des conversations sauvegardées -->
                <div v-if="savedConversations.length > 0">
                    <ul class="divide-y divide-gray-200">
                        <li
                            v-for="conversation in savedConversations"
                            :key="conversation.id"
                            class="px-6 py-4 hover:bg-gray-50 relative"
                        >
                            <!-- Conteneur principal avec flexbox adaptatif -->
                            <div
                                class="flex flex-col md:flex-row md:items-center md:justify-between"
                            >
                                <!-- Informations de la conversation -->
                                <div class="flex-1 min-w-0">
                                    <router-link
                                        :to="`/chat/${conversation.id}`"
                                        class="block"
                                    >
                                        <h3
                                            class="text-lg font-medium text-gray-800 truncate"
                                        >
                                            {{ conversation.name }}
                                        </h3>
                                        <p
                                            class="text-sm text-gray-500 mt-1 flex items-center"
                                        >
                                            <i
                                                class="fas fa-bookmark text-indigo-400 mr-3"
                                            ></i>
                                            <span
                                                >Sauvegardée le
                                                {{
                                                    formatDate(
                                                        conversation.createdAt
                                                    )
                                                }}</span
                                            >
                                        </p>
                                    </router-link>
                                </div>

                                <!-- Actions et statut - en dessous sur mobile, à droite sur desktop -->
                                <div class="flex items-center mt-3 md:mt-0">
                                    <span
                                        class="mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                    >
                                        <i class="fas fa-share-alt mr-1"></i>
                                        Sauvegardée
                                    </span>

                                    <!-- Bouton de suppression -->
                                    <button
                                        class="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-all"
                                        title="Supprimer la conversation"
                                        @click.stop.prevent="
                                            showDeleteConfirm(conversation.id)
                                        "
                                    >
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- État vide -->
                <div v-else class="p-8 text-center">
                    <div class="text-gray-400 text-6xl mb-4">
                        <i class="fas fa-bookmark"></i>
                    </div>
                    <h3 class="text-xl font-medium text-gray-700 mb-2">
                        Aucune conversation sauvegardée
                    </h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                        Vous n'avez pas encore sauvegardé de conversations
                        partagées. Lorsque vous consultez une conversation
                        partagée, cliquez sur "Sauvegarder" pour la retrouver
                        ici.
                    </p>
                </div>
            </div>
        </main>
    </div>
    <DeleteConfirmModal
        v-if="showDeleteConfirmModal"
        title="Supprimer la conversation sauvegardée"
        message="Êtes-vous sûr de vouloir supprimer cette conversation de votre liste de sauvegarde ? Vous pourrez la sauvegarder à nouveau si nécessaire."
        @confirm="confirmDeleteConversation"
        @cancel="showDeleteConfirmModal = false"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, inject, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../../../stores/auth';
import Database from '../../../utils/database.utils';
import LoadingOverlay from '../../../components/LoadingOverlay.vue';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal.vue';
import { Conversation } from '../../../interfaces/conversation.interface';

const toast = useToast();
const authStore = useAuthStore();

// États
const savedConversations = ref<Conversation[]>([]);
const isLoading = ref(true);
const isMobileView = ref(window.innerWidth < 768);
const showMobileMenu = ref(false);

// États pour la suppression
const showDeleteConfirmModal = ref(false);
const conversationIdToDelete = ref<string | null>(null);

// Fonctions injectées
const toggleSidebar = inject('toggleSidebar', () => {});
const closeSidebar = inject('closeSidebar', () => {});
const reloadConversations = inject('reloadConversations', () => {});

// Afficher la modal de confirmation de suppression
function showDeleteConfirm(id: string) {
    conversationIdToDelete.value = id;
    showDeleteConfirmModal.value = true;
}

// Confirmer et exécuter la suppression
async function confirmDeleteConversation() {
    if (!conversationIdToDelete.value) return;

    try {
        // Utiliser l'endpoint de l'API comme dans ChatLayout
        await Database.delete(`conversations/${conversationIdToDelete.value}`);

        // Mettre à jour la liste locale
        savedConversations.value = savedConversations.value.filter(
            (conv) => conv.id !== conversationIdToDelete.value
        );

        // Déclencher le rechargement des conversations dans la sidebar
        reloadConversations();

        toast.success('Conversation supprimée de votre liste');
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la conversation');
    } finally {
        showDeleteConfirmModal.value = false;
        conversationIdToDelete.value = null;
    }
}

// Gestion du responsive
function handleResize() {
    isMobileView.value = window.innerWidth < 768;
}

// Fermer le menu mobile quand on clique ailleurs
function handleOutsideClick(event: MouseEvent) {
    if (showMobileMenu.value) {
        const target = event.target as HTMLElement;
        // Vérifier si le clic provient du bouton de menu ou du contenu du menu
        const isMenuButton = target.closest('[data-mobile-menu-button]');
        const isMenuContent = target.closest('[data-mobile-menu-content]');

        if (!isMenuButton && !isMenuContent) {
            showMobileMenu.value = false;
        }
    }
}

// Initialisation
onMounted(async () => {
    if (isMobileView.value) {
        closeSidebar();
    }

    if (authStore.isAuthenticated) {
        await loadSavedConversations();
    } else {
        isLoading.value = false;
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleOutsideClick); // Ajout de l'écouteur pour le clic extérieur
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('click', handleOutsideClick);
});

// Charger les conversations sauvegardées depuis l'API
async function loadSavedConversations() {
    isLoading.value = true;

    try {
        const response = await Database.getAll('conversations/saved');
        savedConversations.value = response;
    } catch (err) {
        console.error(
            'Erreur lors du chargement des conversations sauvegardées',
            err
        );
        toast.error('Impossible de charger vos conversations sauvegardées');
    } finally {
        isLoading.value = false;
    }
}

// Formater la date
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
</script>

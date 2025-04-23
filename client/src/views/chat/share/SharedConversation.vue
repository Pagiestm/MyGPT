<template>
    <div class="flex flex-col h-screen">
        <LoadingOverlay
            class="px-4"
            :show="isLoading"
            message="Chargement de la conversation partagée..."
        />

        <!-- En-tête avec navigation et actions -->
        <header
            class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between shadow-sm"
        >
            <!-- Partie gauche avec navigation et titre -->
            <div class="flex items-center w-full md:w-auto mb-2 md:mb-0">
                <button
                    class="md:hidden p-2 -ml-1 mr-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    @click="toggleSidebar"
                >
                    <i class="fas fa-bars"></i>
                </button>
                <div class="flex items-center truncate">
                    <div
                        class="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full mr-3 flex items-center flex-shrink-0"
                    >
                        <i class="fas fa-share-alt mr-1"></i> Partagée
                    </div>

                    <h1
                        class="font-semibold text-lg md:text-xl text-gray-800 truncate"
                    >
                        {{ conversation?.name || 'Conversation partagée' }}
                    </h1>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2 ml-auto md:ml-0">
                <button
                    v-if="authStore.isAuthenticated()"
                    class="px-3 py-1.5 rounded-lg flex items-center border border-indigo-500 text-indigo-500 hover:bg-indigo-50 transition-colors"
                    :disabled="isSaving || isSaved"
                    @click="saveToMyList"
                >
                    <span v-if="isSaved">
                        <i class="fas fa-check mr-1.5"></i> Dans votre liste
                    </span>
                    <span v-else-if="isSaving">
                        <i class="fas fa-spinner fa-spin mr-1.5"></i>
                        Sauvegarde...
                    </span>
                    <span v-else>
                        <i class="fas fa-plus mr-1.5"></i> Sauvegarder
                    </span>
                </button>

                <button
                    class="px-2 py-2 rounded-full text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                    title="Copier le lien"
                    @click="copyLink"
                >
                    <i class="fas" :class="copied ? 'fa-check' : 'fa-link'"></i>
                </button>
            </div>
        </header>

        <!-- Corps du message avec la conversation -->
        <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
        >
            <!-- Bannière d'expiration -->
            <div
                v-if="expirationBanner"
                class="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
                <div class="flex items-center">
                    <i class="fas fa-clock text-amber-500 mr-2"></i>
                    <span class="text-amber-700">{{ expirationBanner }}</span>
                </div>
            </div>

            <!-- Contenu normal -->
            <div
                v-if="conversation"
                class="space-y-4 md:space-y-6 py-2 md:py-4"
            >
                <div
                    v-for="message in conversation.messages"
                    :key="message.id"
                    class="group"
                >
                    <MessageBubble :message="message" :is-read-only="true" />
                </div>
            </div>

            <!-- État d'erreur -->
            <div
                v-if="!isLoading && error"
                class="flex flex-col items-center justify-center h-full p-6"
            >
                <div class="text-red-500 text-6xl mb-4">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-700 mb-2">
                    Conversation inaccessible
                </h2>
                <p class="text-gray-500 text-center max-w-md mb-6">
                    {{ errorMessage }}
                </p>
                <router-link
                    to="/"
                    class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                    Retourner à l'accueil
                </router-link>
            </div>

            <!-- Note de fin de conversation -->
            <div
                v-if="conversation && conversation.messages?.length"
                class="text-center text-gray-400 text-sm py-4 mt-6"
            >
                Fin de la conversation partagée
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../../../stores/auth';
import MessageBubble from '../../../components/chat/message/MessageBubble.vue';
import LoadingOverlay from '../../../components/LoadingOverlay.vue';
import Database from '../../../utils/database.utils';
import { Conversation } from '../../../interfaces/conversation.interface';

// Services et utilitaires
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

const reloadConversations = inject('reloadConversations', () => {});
const toggleSidebar = inject('toggleSidebar', () => {});
const emit = defineEmits(['conversation-saved']);

// États
const shareLink = ref(route.params.shareLink as string);
const conversation = ref<Conversation | null>(null);
const isLoading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const isSaving = ref(false);
const isSaved = ref(false);
const copied = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// Message d'expiration
const expirationBanner = computed(() => {
    if (!conversation.value?.shareExpiresAt) return null;

    const expiryDate = new Date(conversation.value.shareExpiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return 'Cette conversation partagée a expiré et ne sera bientôt plus accessible.';
    } else if (diffDays === 1) {
        return 'Cette conversation partagée expire demain.';
    } else if (diffDays <= 7) {
        return `Cette conversation partagée expire dans ${diffDays} jours.`;
    }

    return null;
});

// Chargement initial
onMounted(async () => {
    await loadSharedConversation();
});

// Charger les détails de la conversation partagée
async function loadSharedConversation() {
    isLoading.value = true;
    error.value = false;

    try {
        const response = await Database.getAll(
            `conversations/shared/${shareLink.value}`
        );
        conversation.value = response;
        document.title = `${response.name} (Partagée) | MyGPT`;

        await nextTick();
        scrollToBottom();
    } catch (err) {
        console.error(
            'Erreur lors du chargement de la conversation partagée',
            err
        );
        error.value = true;
        errorMessage.value =
            "Cette conversation partagée n'existe pas, a expiré ou a été supprimée.";
        document.title = 'Conversation inaccessible | MyGPT';
    } finally {
        isLoading.value = false;
    }
}

// Sauvegarder la conversation dans la liste personnelle
async function saveToMyList() {
    if (!conversation.value || isSaved.value) return;

    isSaving.value = true;
    try {
        // Appel à l'API pour sauvegarder la conversation
        const savedConversation = await Database.create(
            'conversations/save-shared',
            {
                conversationId: conversation.value.id,
                shareLink: shareLink.value
            }
        );

        // Mettre à jour l'état local
        isSaved.value = true;
        toast.success('Conversation ajoutée à votre liste');

        // Émettre un événement pour mettre à jour la sidebar
        emit('conversation-saved', savedConversation);

        // Optionnel : utiliser également la fonction injectée
        if (typeof reloadConversations === 'function') {
            reloadConversations();
        }
    } catch (err) {
        console.error('Erreur lors de la sauvegarde de la conversation', err);
        toast.error('Impossible de sauvegarder cette conversation');
    } finally {
        isSaving.value = false;
    }
}

// Copier le lien de partage dans le presse-papiers
async function copyLink() {
    try {
        await navigator.clipboard.writeText(window.location.href);
        copied.value = true;
        toast.success('Lien copié dans le presse-papiers');

        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch (err) {
        console.error('Erreur lors de la copie du lien', err);
        toast.error('Impossible de copier le lien');
    }
}

// Faire défiler vers le bas du conteneur de messages
function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
    }
}
</script>

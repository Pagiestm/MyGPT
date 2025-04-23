<template>
    <div class="flex flex-col md:flex-row h-screen bg-gray-50">
        <!-- Sidebar des conversations (responsive) -->
        <div
            :class="[
                'transition-all duration-300 ease-in-out',
                isMobile ? 'fixed z-40 h-screen' : 'w-72',
                isSidebarOpen
                    ? 'translate-x-0'
                    : '-translate-x-full md:translate-x-0'
            ]"
        >
            <ConversationSidebar
                :conversations="conversations"
                :is-loading="isLoadingSidebar"
                :active-conversation-id="conversationId"
                @create="createNewConversation"
                @select="selectConversation"
                @delete="deleteConversation"
                @delete-confirm="showDeleteConfirm($event)"
                @search="searchConversations"
                @close-sidebar="isSidebarOpen = false"
                @share="showShareModal($event)"
            />
        </div>

        <!-- Overlay pour mobile quand la sidebar est ouverte -->
        <div
            v-if="isMobile && isSidebarOpen"
            class="fixed inset-0 bg-black opacity-30 z-30"
            @click="isSidebarOpen = false"
        ></div>

        <!-- Zone principale du chat -->
        <div class="flex-1 flex flex-col overflow-hidden bg-white shadow-lg">
            <router-view
                @conversation-saved="handleConversationSaved"
            ></router-view>
        </div>

        <!-- Toast de notification simple -->
        <div
            v-if="showNotification"
            class="fixed bottom-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
            {{ notificationMessage }}
        </div>

        <!-- Modal de confirmation de suppression - positionnée au niveau du layout -->
        <DeleteConfirmModal
            v-if="showDeleteConfirmModal"
            title="Supprimer la conversation"
            message="Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible."
            @confirm="confirmDeleteConversation"
            @cancel="showDeleteConfirmModal = false"
        />

        <!-- Modal de partage -->
        <ShareModal
            v-if="showShareConfirmModal && conversationIdToShare"
            :conversation-id="conversationIdToShare"
            @close="showShareConfirmModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, watch, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast, TYPE } from 'vue-toastification';
import ConversationSidebar from './ConversationSidebar.vue';
import DeleteConfirmModal from './DeleteConfirmModal.vue';
import ShareModal from './ShareModal.vue';
import Database from '../../utils/database.utils';
import { Conversation } from '../../interfaces/conversation.interface';

// Services
const router = useRouter();
const route = useRoute();
const toast = useToast();

// États
const conversations = ref<Conversation[]>([]);
const isLoadingSidebar = ref(true);
const conversationId = ref<string | null>(null);
const showNotification = ref(false);
const notificationMessage = ref('');
const windowWidth = ref(window.innerWidth);
const isSidebarOpen = ref(false);

// Gestion de la suppression
const showDeleteConfirmModal = ref(false);
const conversationIdToDelete = ref<string | null>(null);

function showDeleteConfirm(id: string) {
    conversationIdToDelete.value = id;
    showDeleteConfirmModal.value = true;
}

function confirmDeleteConversation() {
    if (conversationIdToDelete.value) {
        // Effectuer la suppression
        deleteConversation(conversationIdToDelete.value);
        showDeleteConfirmModal.value = false;
    }
}

// Gestion du partage
const showShareConfirmModal = ref(false);
const conversationIdToShare = ref<string | null>(null);

function showShareModal(id: string) {
    conversationIdToShare.value = id;
    showShareConfirmModal.value = true;
}

// Responsive detection
const isMobile = computed(() => windowWidth.value < 768);

// Providers
provide('conversations', conversations);
provide('updateConversationTitle', updateConversationTitle);
provide('isMobile', isMobile);
provide('reloadConversations', fetchConversations);

// Fonctions responsive
function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
}

provide('toggleSidebar', toggleSidebar);

function handleResize() {
    windowWidth.value = window.innerWidth;
    if (!isMobile.value) {
        isSidebarOpen.value = false;
    }
}

// Sélectionne une conversation (avec fermeture sidebar sur mobile)
function selectConversation(id: string) {
    router.push(`/chat/${id}`);
    if (isMobile.value) {
        isSidebarOpen.value = false;
    }
}

// Surveillance des changements de route
watch(
    () => route.params.id,
    (newId) => {
        conversationId.value = newId as string;
    },
    { immediate: true }
);

// Initialisation
onMounted(() => {
    fetchConversations();
    window.addEventListener('resize', handleResize);
    handleResize();
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// Récupérer les conversations
async function fetchConversations() {
    isLoadingSidebar.value = true;
    try {
        conversations.value = await Database.getAll('conversations');
    } catch (error) {
        notify('Erreur lors du chargement des conversations', TYPE.ERROR);
        console.error(error);
    } finally {
        isLoadingSidebar.value = false;
    }
}

// Gère l'événement de sauvegarde d'une conversation
function handleConversationSaved(newConversation: Conversation | null) {
    // Ajoute la nouvelle conversation au début de la liste
    if (newConversation) {
        // Vérifie s'il n'y a pas déjà une conversation avec cet ID
        const existingIndex = conversations.value.findIndex(
            (c) => c.id === newConversation.id
        );
        if (existingIndex >= 0) {
            // Met à jour la conversation existante
            conversations.value[existingIndex] = newConversation;
        } else {
            // Ajoute la nouvelle conversation au début
            conversations.value.unshift(newConversation);
        }
    } else {
        // Si aucune conversation n'est passée, recharger toutes les conversations
        fetchConversations();
    }
}

// Recherche des conversations
async function searchConversations(keyword: string) {
    if (!keyword.trim()) return fetchConversations();

    isLoadingSidebar.value = true;
    try {
        conversations.value = await Database.getAll('conversations/search', {
            keyword: keyword.trim()
        });
    } catch (error) {
        notify('Erreur lors de la recherche', TYPE.ERROR);
        console.error(error);
    } finally {
        isLoadingSidebar.value = false;
    }
}

// Crée une nouvelle conversation
async function createNewConversation() {
    try {
        const apiResponse = await Database.create('conversations', {
            name: 'Nouvelle conversation'
        });

        const conversation = apiResponse.data || apiResponse;

        if (conversation?.id) {
            conversations.value.unshift(conversation);
            router.push(`/chat/${conversation.id}`);
        } else {
            notify('Format de réponse inattendu', TYPE.ERROR);
        }
    } catch (error: unknown) {
        console.error('Erreur:', error);
        const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ||
            'Erreur lors de la création de la conversation';
        notify(`Erreur: ${errorMessage}`, TYPE.ERROR);
    }
}

// Supprime une conversation
async function deleteConversation(id: string) {
    try {
        await Database.delete(`conversations/${id}`);
        conversations.value = conversations.value.filter(
            (conv) => conv.id !== id
        );

        if (conversationId.value === id) {
            if (conversations.value.length > 0) {
                router.push(`/chat/${conversations.value[0].id}`);
            } else {
                router.push('/chat');
            }
        }
    } catch (error) {
        notify('Erreur lors de la suppression', TYPE.ERROR);
        console.error(error);
    }
}

// Met à jour le titre d'une conversation
async function updateConversationTitle(id: string, newTitle: string) {
    try {
        await Database.patch(`conversations/${id}`, { name: newTitle });
        conversations.value = conversations.value.map((conv) =>
            conv.id === id ? { ...conv, name: newTitle } : conv
        );
        notify('Titre mis à jour');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du titre:', error);
        notify('Erreur lors de la mise à jour du titre', TYPE.ERROR);
    }
}

// Helper pour les notifications
function notify(message: string, type = TYPE.SUCCESS) {
    toast(message, { type });
}
</script>

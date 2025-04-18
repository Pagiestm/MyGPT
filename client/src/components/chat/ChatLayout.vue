<template>
    <div class="flex h-screen bg-gray-50">
        <!-- Sidebar des conversations -->
        <ConversationSidebar
            :conversations="conversations"
            :is-loading="isLoadingSidebar"
            :active-conversation-id="conversationId"
            @create="createNewConversation"
            @select="selectConversation"
            @delete="deleteConversation"
            @search="searchConversations"
        />

        <!-- Zone principale du chat -->
        <div class="flex-1 flex flex-col overflow-hidden bg-white shadow-lg">
            <router-view></router-view>
        </div>

        <!-- Toast de notification simple -->
        <div
            v-if="showNotification"
            class="fixed bottom-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
            {{ notificationMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast, TYPE } from 'vue-toastification';
import ConversationSidebar from './ConversationSidebar.vue';
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

// Providers
provide('conversations', conversations);
provide('updateConversationTitle', updateConversationTitle);

// Surveillance des changements de route
watch(
    () => route.params.id,
    (newId) => {
        conversationId.value = newId as string;
    },
    { immediate: true }
);

// Initialisation
onMounted(fetchConversations);

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

// Sélectionne une conversation
function selectConversation(id: string) {
    router.push(`/chat/${id}`);
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

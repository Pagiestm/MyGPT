<template>
    <div
        class="w-72 bg-white shadow-lg flex flex-col h-full border-r border-gray-200 p-4"
    >
        <!-- Bouton Nouvelle conversation -->
        <div class="mb-4">
            <button
                class="w-full bg-indigo-500 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center font-semibold"
                @click="$emit('create')"
            >
                <i class="fas fa-plus mr-2"></i> Nouvelle conversation
            </button>
        </div>

        <!-- Barre de recherche -->
        <SearchBar v-model="searchQuery" @input="debounceSearch" />

        <!-- Titre section -->
        <h3 class="text-sm uppercase font-semibold text-gray-500 mb-4 px-2">
            Conversations
        </h3>

        <!-- Liste des conversations -->
        <div class="flex-1 overflow-y-auto space-y-1.5 pr-1">
            <!-- État chargement -->
            <LoadingIndicator v-if="isLoading" />

            <!-- État vide -->
            <EmptyState
                v-else-if="conversations.length === 0"
                :search-mode="!!searchQuery"
            />

            <!-- Liste conversations -->
            <ConversationList
                v-else
                :conversations="conversations"
                :active-id="activeConversationId"
                :open-menu-id="openMenuId"
                @select="$emit('select', $event)"
                @toggle-menu="toggleMenu"
                @delete="confirmDelete"
            />
        </div>

        <!-- Modal de confirmation de suppression -->
        <DeleteConfirmModal
            v-if="showDeleteConfirm"
            title="Supprimer la conversation"
            message="Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible."
            @confirm="deleteConversation"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Conversation } from '../../interfaces/conversation.interface';
import DeleteConfirmModal from './DeleteConfirmModal.vue';
import SearchBar from './sidebar/SearchBar.vue';
import LoadingIndicator from './sidebar/LoadingIndicator.vue';
import EmptyState from './sidebar/EmptyState.vue';
import ConversationList from './sidebar/ConversationList.vue';

// Props
defineProps<{
    conversations: Conversation[];
    isLoading: boolean;
    activeConversationId: string | null;
}>();

// Emits
const emit = defineEmits<{
    (e: 'create'): void;
    (e: 'select', id: string): void;
    (e: 'delete', id: string): void;
    (e: 'search', keyword: string): void;
}>();

// Gestion de la recherche
const searchQuery = ref('');
const searchTimeout = ref<number | null>(null);

function debounceSearch() {
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }
    searchTimeout.value = setTimeout(() => {
        emit('search', searchQuery.value);
    }, 300) as unknown as number;
}

// Gestion du menu d'options
const openMenuId = ref<string | null>(null);

function toggleMenu(id: string) {
    openMenuId.value = openMenuId.value === id ? null : id;
}

// Gestion de la suppression
const showDeleteConfirm = ref(false);
const conversationIdToDelete = ref<string | null>(null);

function confirmDelete(id: string) {
    conversationIdToDelete.value = id;
    showDeleteConfirm.value = true;
    openMenuId.value = null;
}

function deleteConversation() {
    if (conversationIdToDelete.value) {
        emit('delete', conversationIdToDelete.value);
        showDeleteConfirm.value = false;
    }
}

// Ferme le menu lorsqu'on clique ailleurs
onMounted(() => {
    document.addEventListener('click', () => {
        openMenuId.value = null;
    });
});
</script>

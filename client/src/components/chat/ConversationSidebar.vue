<template>
    <div
        class="bg-white shadow-lg flex flex-col h-full border-r border-gray-200 p-4 w-full md:w-72"
    >
        <!-- Bouton Nouvelle conversation -->
        <div class="mb-4 flex items-center justify-between">
            <button
                class="flex-1 bg-indigo-500 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center font-semibold"
                @click="$emit('create')"
            >
                <i class="fas fa-plus mr-2"></i> Nouvelle conversation
            </button>

            <!-- Bouton pour fermer la sidebar sur mobile -->
            <button
                v-if="isMobile"
                class="ml-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
                @click="$emit('close-sidebar')"
            >
                <i class="fas fa-times"></i>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { Conversation } from '../../interfaces/conversation.interface';
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
    (e: 'delete-confirm', id: string): void;
    (e: 'search', keyword: string): void;
    (e: 'close-sidebar'): void;
}>();

// Détection responsive
const isMobile = inject('isMobile', ref(false));

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

function confirmDelete(id: string) {
    emit('delete-confirm', id);
    openMenuId.value = null;
}

// Ferme le menu lorsqu'on clique ailleurs
onMounted(() => {
    document.addEventListener('click', () => {
        openMenuId.value = null;
    });
});
</script>

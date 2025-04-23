<template>
    <div
        ref="searchContainer"
        class="border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
        <!-- Barre de recherche -->
        <div class="flex gap-2">
            <div class="relative flex-1">
                <i
                    class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                ></i>
                <input
                    v-model="keyword"
                    type="text"
                    class="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-10 text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1"
                    placeholder="Rechercher dans la conversation..."
                    @keydown.enter="performSearch"
                />
                <i
                    v-if="keyword"
                    class="fas fa-times absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    @click="clearSearch"
                ></i>
            </div>
            <button
                class="flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-4 font-medium text-white disabled:opacity-60 hover:bg-indigo-600"
                :disabled="isSearching || !keyword.trim()"
                @click="performSearch"
            >
                <i v-if="isSearching" class="fas fa-spinner fa-spin mr-1"></i>
                <span>Rechercher</span>
            </button>
        </div>

        <!-- Résultats -->
        <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
        >
            <div
                v-if="
                    searchResults.length > 0 ||
                    (searchPerformed && !searchResults.length)
                "
                class="mt-3"
            >
                <!-- En-tête des résultats -->
                <div class="mb-2 flex justify-between">
                    <span class="text-sm text-gray-500 font-medium">
                        {{
                            searchResults.length
                                ? `${searchResults.length} résultat(s)`
                                : 'Aucun résultat'
                        }}
                    </span>
                    <button
                        v-if="searchResults.length"
                        class="text-xs text-indigo-600 hover:text-indigo-800"
                        @click="clearSearch"
                    >
                        Effacer
                    </button>
                </div>

                <!-- Liste des résultats -->
                <div
                    v-if="searchResults.length"
                    class="max-h-72 space-y-2 overflow-y-auto pr-1"
                >
                    <div
                        v-for="message in searchResults"
                        :key="message.id"
                        class="cursor-pointer rounded-lg border border-gray-200 p-3 shadow-sm hover:-translate-y-0.5 hover:bg-indigo-50 transition-all"
                        @click="scrollToMessage(message.id)"
                    >
                        <!-- En-tête du message -->
                        <div class="flex justify-between items-center mb-1.5">
                            <div class="flex items-center">
                                <div
                                    :class="`w-5 h-5 rounded-full flex items-center justify-center text-white ${message.isFromAi ? 'bg-indigo-500' : 'bg-emerald-500'}`"
                                >
                                    <i
                                        :class="
                                            message.isFromAi
                                                ? 'fas fa-robot'
                                                : 'fas fa-user'
                                        "
                                        class="text-xs"
                                    ></i>
                                </div>
                                <span
                                    :class="`ml-1.5 text-sm font-medium ${message.isFromAi ? 'text-indigo-600' : 'text-emerald-600'}`"
                                >
                                    {{ message.isFromAi ? 'IA' : 'Vous' }}
                                </span>
                            </div>
                            <span
                                class="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full"
                            >
                                {{ formatDate(message.createdAt) }}
                            </span>
                        </div>

                        <!-- Contenu avec surlignage -->
                        <div class="line-clamp-2 text-sm text-gray-700">
                            <template
                                v-for="(part, idx) in highlightText(
                                    message.content
                                )"
                                :key="idx"
                            >
                                <mark
                                    v-if="part.highlight"
                                    class="bg-yellow-200/50 rounded px-0.5 font-medium"
                                >
                                    {{ part.text }}
                                </mark>
                                <template v-else>{{ part.text }}</template>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Message pour aucun résultat -->
                <div
                    v-if="searchPerformed && !searchResults.length"
                    class="rounded-lg bg-gray-50 border py-5 text-center"
                >
                    <i class="fas fa-search text-xl text-gray-400 mb-2"></i>
                    <p class="text-gray-600">Aucun message ne correspond</p>
                    <p class="text-sm text-gray-500">Essayez un autre terme</p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Database from '../../../utils/database.utils';
import { Message } from '../../../interfaces/message.interface';

// Props & Emits
const props = defineProps<{ conversationId: string }>();
const emit = defineEmits<{
    (e: 'scrollToMessage', messageId: string): void;
    (e: 'close'): void;
}>();

// État
const keyword = ref('');
const searchResults = ref<Message[]>([]);
const isSearching = ref(false);
const searchPerformed = ref(false);
const searchContainer = ref<HTMLElement | null>(null);

// Recherche
async function performSearch() {
    if (!keyword.value.trim() || isSearching.value) return;

    isSearching.value = true;
    searchPerformed.value = true;

    try {
        searchResults.value = await Database.getAll('messages/search', {
            keyword: keyword.value,
            conversationId: props.conversationId
        });
    } catch (error) {
        console.error('Erreur de recherche:', error);
    } finally {
        isSearching.value = false;
    }
}

// Actions
function clearSearch() {
    keyword.value = '';
    searchResults.value = [];
    searchPerformed.value = false;
}

function scrollToMessage(messageId: string) {
    emit('scrollToMessage', messageId);
    emit('close');
}

// Formatage
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Surlignage
type TextPart = { text: string; highlight: boolean };

function highlightText(text: string): TextPart[] {
    if (!keyword.value.trim()) return [{ text, highlight: false }];

    try {
        const pattern = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts: TextPart[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    text: text.substring(lastIndex, match.index),
                    highlight: false
                });
            }
            parts.push({ text: match[0], highlight: true });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push({ text: text.substring(lastIndex), highlight: false });
        }

        return parts;
    } catch (error) {
        console.error('Erreur de surlignage:', error);
        return [{ text, highlight: false }];
    }
}

// Détection clic extérieur
function handleOutsideClick(event: MouseEvent) {
    if (
        searchContainer.value &&
        !searchContainer.value.contains(event.target as Node)
    ) {
        emit('close');
    }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick));
onUnmounted(() =>
    document.removeEventListener('mousedown', handleOutsideClick)
);
</script>

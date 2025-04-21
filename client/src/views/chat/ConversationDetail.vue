<template>
    <div class="flex flex-col h-full">
        <ConversationHeader
            :title="conversation?.name || 'Chargement...'"
            @update:title="updateTitle"
            @toggle-search="toggleSearch"
            @toggle-sidebar="toggleSidebar"
        />

        <!-- Barre de recherche -->
        <MessageSearch
            v-if="isSearchOpen"
            class="px-4 py-2 border-b border-gray-200 bg-white"
            :conversation-id="conversationId || ''"
            @scroll-to-message="scrollToMessage"
            @close="isSearchOpen = false"
        />

        <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
        >
            <!-- Chargement -->
            <div
                v-if="isLoading"
                class="flex justify-center items-center h-full"
            >
                <LoadingDots />
            </div>

            <!-- Conversation vide -->
            <EmptyState v-else-if="messages.length === 0" />

            <!-- Messages -->
            <div v-else class="space-y-4 md:space-y-6 py-2 md:py-4">
                <div
                    v-for="message in filteredMessages"
                    :id="`message-${message.id}`"
                    :key="message.id"
                    class="group"
                    :class="{
                        'highlight-message': highlightedMessageId === message.id
                    }"
                >
                    <MessageBubble
                        :message="message"
                        :is-saving="
                            isUpdatingMessage &&
                            editingMessage?.id === message.id
                        "
                        :is-regenerating="false"
                        @edit="updateMessage"
                    />
                </div>

                <!-- Animation de chargement pour la réponse IA -->
                <div v-if="isGeneratingResponse" class="group">
                    <MessageBubble
                        :message="tempAiMessage"
                        :is-regenerating="true"
                    />
                </div>
            </div>
        </div>

        <MessageInput :is-sending="isSending" @send="sendMessage" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, inject, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import Database from '../../utils/database.utils';

// Import des interfaces séparément
import { Message } from '../../interfaces/message.interface';
import { Conversation } from '../../interfaces/conversation.interface';

import ConversationHeader from '../../components/chat/ConversationHeader.vue';
import MessageBubble from '../../components/chat/message/MessageBubble.vue';
import MessageInput from '../../components/chat/message/MessageInput.vue';
import LoadingDots from '../../components/chat/message/LoadingDots.vue';
import EmptyState from '../../components/chat/EmptyState.vue';
import MessageSearch from '../../components/chat/message/MessageSearch.vue';

// Services
const route = useRoute();
const router = useRouter();
const toast = useToast();
const parentUpdateTitle = inject('updateConversationTitle') as
    | ((id: string, title: string) => void)
    | undefined;

// États
const conversationId = ref<string | null>(null);
const conversation = ref<Conversation | null>(null);
const messages = ref<Message[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);

// États UI
const isLoading = ref(false);
const isSending = ref(false);
const isGeneratingResponse = ref(false);
const isUpdatingMessage = ref(false);
const editingMessage = ref<Message | null>(null);
const regeneratingMessageId = ref<string | null>(null);
const pendingAiMessageId = ref<string | null>(null);

// États de la recherche
const isSearchOpen = ref(false);
const highlightedMessageId = ref<string | null>(null);

// Computed properties
const filteredMessages = computed(() => {
    if (isGeneratingResponse.value && regeneratingMessageId.value) {
        return messages.value.filter((message) => {
            const isTargetAiMessage =
                message.isFromAi && message.id === regeneratingMessageId.value;
            const isEditedUserMessage =
                !message.isFromAi &&
                editingMessage.value &&
                message.id === editingMessage.value.id;
            return !isTargetAiMessage && !isEditedUserMessage;
        });
    }
    return messages.value;
});

const tempAiMessage = computed(() => ({
    id: 'temp-ai-message',
    content: '',
    conversationId: conversationId.value || '',
    isFromAi: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
}));

const toggleSidebar = inject('toggleSidebar', () => {});

// Initialisation
onMounted(async () => {
    conversationId.value = route.params.id as string;
    await loadConversationData();
});

watch(
    () => route.params.id,
    async (newId) => {
        if (newId !== conversationId.value) {
            conversationId.value = newId as string;
            await loadConversationData();
            // Réinitialiser l'état de la recherche lors du changement de conversation
            isSearchOpen.value = false;
            highlightedMessageId.value = null;
        }
    }
);

// Fonctions
async function loadConversationData() {
    await fetchConversation();
    await fetchMessages();
    await nextTick();
    scrollToBottom();
}

function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value;
    if (!isSearchOpen.value) {
        highlightedMessageId.value = null;
    }
}

function updateTitle(newTitle: string) {
    if (conversation.value && conversationId.value && parentUpdateTitle) {
        conversation.value.name = newTitle;
        parentUpdateTitle(conversationId.value, newTitle);
    }
}

// Fonction pour faire défiler vers un message trouvé
function scrollToMessage(messageId: string) {
    highlightedMessageId.value = messageId;

    nextTick(() => {
        const messageElement = document.getElementById(`message-${messageId}`);

        if (messageElement && messagesContainer.value) {
            // 1. Ajouter la classe d'animation
            messageElement.classList.add('highlight-message');

            // 2. Faire défiler vers le message
            messagesContainer.value.scrollTo({
                top: messageElement.offsetTop - 100,
                behavior: 'smooth'
            });

            // 3. Préparer la sortie fluide après un délai
            setTimeout(() => {
                // D'abord, ajouter une classe de sortie (fade-out)
                messageElement.classList.add('highlight-fade-out');

                // Puis, après la fin de l'animation de sortie, retirer toutes les classes
                setTimeout(() => {
                    messageElement.classList.remove(
                        'highlight-message',
                        'highlight-fade-out'
                    );
                    highlightedMessageId.value = null;
                }, 1000); // Durée de l'animation de sortie
            }, 3000);
        }
    });
}

async function fetchConversation() {
    if (!conversationId.value) return;

    try {
        conversation.value = await Database.getOne(
            'conversations',
            conversationId.value
        );
    } catch (error) {
        toast.error('Erreur lors du chargement de la conversation');
        console.error(error);
        router.push('/chat');
    }
}

async function fetchMessages() {
    if (!conversationId.value) return;

    isLoading.value = true;
    try {
        messages.value = await Database.getAll('messages', {
            conversationId: conversationId.value
        });
    } catch (error) {
        toast.error('Erreur lors du chargement des messages');
        console.error(error);
    } finally {
        isLoading.value = false;
    }
}

async function sendMessage(content: string) {
    if (!conversationId.value || isSending.value) return;

    isSending.value = true;

    try {
        const response = await Database.create('messages', {
            content,
            conversationId: conversationId.value,
            isFromAi: false
        });

        messages.value.push(response.data);
        await nextTick();
        scrollToBottom();

        // Indiquer que l'IA génère une réponse
        isGeneratingResponse.value = true;
        pendingAiMessageId.value = null;

        // Simuler la réponse de l'IA
        setTimeout(finishAiResponse, 1500);
    } catch (error) {
        toast.error("Erreur lors de l'envoi du message");
        console.error(error);
    } finally {
        isSending.value = false;
    }
}

async function updateMessage(
    message: Message,
    content: string,
    regenerateAi: boolean = true
) {
    if (isUpdatingMessage.value) return;

    isUpdatingMessage.value = true;
    editingMessage.value = message;

    try {
        if (regenerateAi) {
            // Identifier le message IA à régénérer
            const currentIndex = messages.value.findIndex(
                (m) => m.id === message.id
            );
            if (
                currentIndex >= 0 &&
                currentIndex + 1 < messages.value.length &&
                messages.value[currentIndex + 1].isFromAi
            ) {
                regeneratingMessageId.value =
                    messages.value[currentIndex + 1].id;
            }

            isGeneratingResponse.value = true;
        }

        // Mise à jour du message
        await Database.update('messages', message.id, {
            content,
            regenerateAi
        });

        if (!regenerateAi) {
            await fetchMessages();
        } else {
            // Simuler la génération d'une nouvelle réponse
            pendingAiMessageId.value = null;
            setTimeout(finishAiResponse, 1500);
        }
    } catch (error) {
        toast.error('Erreur modification message');
        console.error(error);
        if (regenerateAi) {
            isGeneratingResponse.value = false;
            regeneratingMessageId.value = null;
        }
    } finally {
        editingMessage.value = null;
        isUpdatingMessage.value = false;
    }
}

async function finishAiResponse() {
    await fetchMessages();
    isGeneratingResponse.value = false;
    regeneratingMessageId.value = null;
    pendingAiMessageId.value = null;
    await nextTick();
    scrollToBottom();
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop =
            messagesContainer.value.scrollHeight;
    }
}
</script>

<style scoped>
/* Animation d'entrée et maintien */
.highlight-message {
    animation: highlight-appear 0.5s ease;
    background-color: rgba(99, 102, 241, 0.1);
    border-radius: 0.5rem;
    transition: all 1s ease-out;
}

/* Animation de sortie */
.highlight-fade-out {
    background-color: rgba(99, 102, 241, 0);
    box-shadow: 0 0 0 rgba(99, 102, 241, 0);
}

@keyframes highlight-appear {
    0% {
        background-color: rgba(99, 102, 241, 0);
    }
    50% {
        background-color: rgba(99, 102, 241, 0.3);
    }
    100% {
        background-color: rgba(99, 102, 241, 0.1);
    }
}
</style>

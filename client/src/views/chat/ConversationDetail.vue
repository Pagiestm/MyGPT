<template>
  <div class="flex flex-col h-full">
    <ConversationHeader
      :title="conversation?.name || 'Chargement...'"
      @update:title="updateTitle"
      @toggle-search="toggleSearch"
      @toggle-sidebar="toggleSidebar"
    />

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
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <LoadingOverlay :show="isLoading" message="Chargement en cours..." />
      </div>

      <EmptyState v-else-if="messages.length === 0" />

      <div v-else class="space-y-4 md:space-y-6 py-2 md:py-4">
        <div
          v-for="message in filteredMessages"
          :id="`message-${message.id}`"
          :key="message.id"
          class="group"
          :class="{
            'highlight-message': highlightedMessageId === message.id,
          }"
        >
          <MessageBubble
            :message="message"
            :is-saving="isUpdatingMessage && editingMessage?.id === message.id"
            :is-regenerating="false"
            @edit="updateMessage"
          />
        </div>

        <div v-if="isGeneratingResponse" class="group">
          <MessageBubble :message="tempAiMessage" :is-regenerating="true" />
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

import { Message } from '../../interfaces/message.interface';
import { Conversation } from '../../interfaces/conversation.interface';

import ConversationHeader from '../../components/chat/ConversationHeader.vue';
import MessageBubble from '../../components/chat/message/MessageBubble.vue';
import MessageInput from '../../components/chat/message/MessageInput.vue';
import LoadingOverlay from '../../components/LoadingOverlay.vue';
import EmptyState from '../../components/chat/EmptyState.vue';
import MessageSearch from '../../components/chat/message/MessageSearch.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const parentUpdateTitle = inject('updateConversationTitle') as
  ((id: string, title: string) => void) | undefined;

const conversationId = ref<string | null>(null);
const conversation = ref<Conversation | null>(null);
const messages = ref<Message[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);

const isLoading = ref(false);
const isSending = ref(false);
const isGeneratingResponse = ref(false);
const isUpdatingMessage = ref(false);
const editingMessage = ref<Message | null>(null);
const regeneratingMessageId = ref<string | null>(null);
const pendingAiMessageId = ref<string | null>(null);

const isSearchOpen = ref(false);
const highlightedMessageId = ref<string | null>(null);

const filteredMessages = computed(() => {
  return messages.value;
});

const tempAiMessage = computed(() => ({
  id: 'temp-ai-message',
  content: '',
  conversationId: conversationId.value || '',
  isFromAi: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const toggleSidebar = inject('toggleSidebar', () => {});

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
  },
);

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

function scrollToMessage(messageId: string) {
  highlightedMessageId.value = messageId;

  nextTick(() => {
    const messageElement = document.getElementById(`message-${messageId}`);

    if (messageElement && messagesContainer.value) {
      messageElement.classList.add('highlight-message');

      messagesContainer.value.scrollTo({
        top: messageElement.offsetTop - 100,
        behavior: 'smooth',
      });

      // 3. Préparer la sortie fluide après un délai
      setTimeout(() => {
        messageElement.classList.add('highlight-fade-out');

        // Puis, après la fin de l'animation de sortie, retirer toutes les classes
        setTimeout(() => {
          messageElement.classList.remove('highlight-message', 'highlight-fade-out');
          highlightedMessageId.value = null;
        }, 1000); // Durée de l'animation de sortie
      }, 3000);
    }
  });
}

async function fetchConversation() {
  if (!conversationId.value) return;

  try {
    conversation.value = await Database.getOne('conversations', conversationId.value);
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
      conversationId: conversationId.value,
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
      isFromAi: false,
    });

    messages.value.push(response.data);
    await nextTick();
    scrollToBottom();

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

async function updateMessage(message: Message, content: string, regenerateAi: boolean = true) {
  if (isUpdatingMessage.value) return;

  isUpdatingMessage.value = true;
  editingMessage.value = message;

  try {
    // Supprimer visuellement tous les messages suivants immédiatement
    if (regenerateAi) {
      const currentIndex = messages.value.findIndex((m) => m.id === message.id);

      if (currentIndex >= 0) {
        messages.value = messages.value.slice(0, currentIndex + 1);

        messages.value[currentIndex].content = content;
      }

      isGeneratingResponse.value = true;
    }

    await Database.update('messages', message.id, {
      content,
      regenerateAi,
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
    }
    // En cas d'erreur, recharger les messages pour revenir à l'état initial
    await fetchMessages();
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

  // Attendre le rendu avant de scroller
  await nextTick();
  scrollToBottom();
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}
</script>

<style scoped>
.highlight-message {
  animation: highlight-appear 0.5s ease;
  background-color: rgba(99, 102, 241, 0.1);
  border-radius: 0.5rem;
  transition: all 1s ease-out;
}

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

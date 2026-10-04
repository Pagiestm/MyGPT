<template>
  <UDashboardPanel id="conversation">
    <template #header>
      <UDashboardNavbar :ui="{ root: 'border-none', title: 'min-w-0' }">
        <template #title>
          <ConversationTitle v-if="conversation" :name="conversation.name" @rename="rename" />
          <USkeleton v-else class="h-5 w-48" />
        </template>
        <template #right>
          <MessageSearch :conversation-id="id" @select="focusMessage" />
          <ShareModal v-if="conversation" :conversation="conversation" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex-1 sm:max-w-3xl">
        <div v-if="isPending" class="flex flex-col gap-6 py-6">
          <USkeleton class="ms-auto h-10 w-2/3" />
          <USkeleton class="h-24 w-full" />
        </div>
        <UEmpty
          v-else-if="!messages?.length && !thinking"
          icon="i-lucide-message-circle"
          title="La conversation est vide"
          description="Écrivez votre premier message ci-dessous."
          class="py-24"
        />
        <ChatThread
          v-else
          :messages="messages ?? []"
          :thinking="thinking"
          :highlighted="highlighted"
          :reveal-id="revealId"
          @edit="onEdit"
          @revealed="revealId = null"
        />
      </UContainer>
    </template>

    <template #footer>
      <UContainer class="pb-4 sm:max-w-3xl sm:pb-6">
        <UChatPrompt
          v-model="input"
          placeholder="Écrivez votre message..."
          variant="outline"
          color="neutral"
          :disabled="thinking"
          @submit="submit"
        >
          <UChatPromptSubmit
            class="rounded-full"
            :status="thinking ? 'submitted' : 'ready'"
            aria-label="Envoyer le message"
          />
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UChatPrompt from '@nuxt/ui/components/ChatPrompt.vue';
import UChatPromptSubmit from '@nuxt/ui/components/ChatPromptSubmit.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UEmpty from '@nuxt/ui/components/Empty.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useConversation, useRenameConversation } from '@/application/composables/useConversations';
import {
  useEditMessage,
  useMessageList,
  useSendMessage,
} from '@/application/composables/useMessages';
import { takePendingPrompt } from '@/application/composables/usePendingPrompt';
import ChatThread from '@/presentation/components/chat/ChatThread.vue';
import ConversationTitle from '@/presentation/components/chat/ConversationTitle.vue';
import MessageSearch from '@/presentation/components/chat/MessageSearch.vue';
import ShareModal from '@/presentation/components/sharing/ShareModal.vue';

const props = defineProps<{ id: string }>();

const router = useRouter();
const toast = useToast();

const input = ref('');
const highlighted = ref<string | null>(null);

const { data: conversation, error } = useConversation(() => props.id);
const { data: messages, isPending } = useMessageList(() => props.id);
const { mutateAsync: send, isLoading: sending } = useSendMessage(() => props.id);
const { mutateAsync: edit, isLoading: editing } = useEditMessage(() => props.id);
const { mutateAsync: renameConversation } = useRenameConversation();

const thinking = computed(() => sending.value || editing.value);

// Seule la réponse arrivée après un envoi ou une modification est animée, pas l'historique
const revealId = ref<string | null>(null);
let awaitingReply = false;
let knownIds = new Set<string>();

watch(
  messages,
  (list = []) => {
    const reply = list.at(-1);
    if (awaitingReply && reply?.isFromAi && !knownIds.has(reply.id)) {
      revealId.value = reply.id;
      awaitingReply = false;
    }
    knownIds = new Set(list.map((message) => message.id));
  },
  { flush: 'pre' },
);

watch(error, (value) => {
  if (!value) return;
  toast.add({ title: 'Conversation introuvable', color: 'error' });
  router.replace({ name: 'new-chat' });
});

watch(conversation, (value) => {
  if (value) document.title = `${value.name} · MyGPT`;
});

watch(
  () => props.id,
  (id) => {
    const pending = takePendingPrompt(id);
    if (pending) sendMessage(pending);
  },
  { immediate: true },
);

async function sendMessage(content: string) {
  awaitingReply = true;
  try {
    await send(content);
  } catch {
    awaitingReply = false;
    toast.add({ title: "Le message n'a pas pu être envoyé", color: 'error' });
  }
}

function submit() {
  const content = input.value.trim();
  if (!content || thinking.value) return;
  input.value = '';
  sendMessage(content);
}

async function onEdit(messageId: string, content: string) {
  awaitingReply = true;
  try {
    await edit({ messageId, content });
  } catch {
    awaitingReply = false;
    toast.add({ title: "La modification n'a pas pu être enregistrée", color: 'error' });
  }
}

async function rename(name: string) {
  try {
    await renameConversation({ id: props.id, name });
  } catch {
    toast.add({ title: 'Impossible de renommer la conversation', color: 'error' });
  }
}

function focusMessage(messageId: string) {
  highlighted.value = messageId;
  document
    .getElementById(`message-${messageId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => (highlighted.value = null), 2600);
}
</script>

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
          v-else-if="!messages?.length && !chat.busy.value"
          icon="i-lucide-message-circle"
          title="La conversation est vide"
          description="Écrivez votre premier message ci-dessous."
          class="py-24"
        />
        <template v-else>
          <BaseLoadMore
            :has-more="hasOlder"
            :loading="loadingOlder"
            label="Charger les messages précédents"
            @more="loadOlder()"
          />
          <ChatThread
            :messages="messages ?? []"
            :phase="chat.phase.value"
            :highlighted="highlighted"
            @edit="(messageId, content) => chat.edit(messageId, content, model)"
            @regenerate="chat.regenerate(model)"
          />
        </template>
      </UContainer>
    </template>

    <template #footer>
      <UContainer class="pb-4 sm:max-w-3xl sm:pb-6">
        <ChatComposer
          v-model="input"
          v-model:model="model"
          :phase="chat.phase.value"
          @submit="({ content, attachments }) => chat.send(content, attachments, model)"
          @stop="chat.stop()"
        />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UEmpty from '@nuxt/ui/components/Empty.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  useConversation,
  useUpdateConversation,
} from '@/features/chat/composables/useConversations';
import { useMessageList } from '@/features/chat/composables/useMessages';
import { useChatStream } from '@/features/chat/composables/useChatStream';
import { takePendingPrompt } from '@/features/chat/composables/usePendingPrompt';
import ChatComposer from '@/features/chat/components/ChatComposer.vue';
import ChatThread from '@/features/chat/components/ChatThread.vue';
import BaseLoadMore from '@/shared/ui/BaseLoadMore.vue';
import ConversationTitle from '@/features/chat/components/ConversationTitle.vue';
import MessageSearch from '@/features/chat/components/MessageSearch.vue';
import ShareModal from '@/features/chat/components/ShareModal.vue';

const props = defineProps<{ id: string }>();

const route = useRoute();
const router = useRouter();
const toast = useToast();

const input = ref('');
const model = ref<string>();
const highlighted = ref<string | null>(null);

const { data: conversation, error } = useConversation(() => props.id);
const {
  items: messages,
  isPending,
  hasMore: hasOlder,
  loadMore: loadOlder,
  loadingMore: loadingOlder,
} = useMessageList(() => props.id);
const { mutateAsync: updateConversation } = useUpdateConversation();

const chat = useChatStream(() => props.id, {
  onError: (message) => toast.add({ title: message, color: 'error' }),
});

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
    if (!pending) return;
    model.value = pending.model;
    chat.send(pending.content, pending.attachments, pending.model);
  },
  { immediate: true },
);

async function rename(name: string) {
  try {
    await updateConversation({ id: props.id, patch: { name } });
  } catch {
    toast.add({ title: 'Impossible de renommer la conversation', color: 'error' });
  }
}

watch(
  [() => route.hash, messages],
  ([hash, list]) => {
    const messageId = hash.startsWith('#message-') ? hash.slice('#message-'.length) : null;
    if (messageId && list?.some((message) => message.id === messageId)) {
      nextTick(() => focusMessage(messageId));
      router.replace({ hash: '' });
    }
  },
  { immediate: true },
);

function focusMessage(messageId: string) {
  highlighted.value = messageId;
  document
    .getElementById(`message-${messageId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => (highlighted.value = null), 2600);
}
</script>

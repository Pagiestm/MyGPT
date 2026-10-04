<template>
  <UChatMessages
    :messages="uiMessages"
    :status="thinking ? 'submitted' : 'ready'"
    :user="user"
    :assistant="assistant"
    should-auto-scroll
  >
    <template #content="{ message }">
      <div
        :id="`message-${message.id}`"
        class="scroll-mt-24 rounded-md transition-colors"
        :class="{ 'ring-2 ring-primary': highlighted === message.id }"
      >
        <MessageContent v-if="message.role === 'assistant'" :content="textOf(message)" />
        <form
          v-else-if="editingId === message.id"
          class="flex w-[min(36rem,70vw)] flex-col gap-2"
          @submit.prevent="submitEdit(message.id)"
        >
          <UTextarea
            v-model="draft"
            placeholder="Modifiez votre message..."
            aria-label="Modifier le message"
            autoresize
            autofocus
            class="w-full"
          />
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="sm" @click="editingId = null"
              >Annuler</UButton
            >
            <UButton type="submit" size="sm" :disabled="!draft.trim()">Modifier</UButton>
          </div>
        </form>
        <p v-else class="whitespace-pre-wrap">{{ textOf(message) }}</p>
      </div>
    </template>

    <template #indicator>
      <div class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-sparkles" class="size-4 animate-pulse text-primary" />
        <UChatShimmer text="MyGPT réfléchit…" />
      </div>
    </template>
  </UChatMessages>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UChatMessages from '@nuxt/ui/components/ChatMessages.vue';
import UChatShimmer from '@nuxt/ui/components/ChatShimmer.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import UTextarea from '@nuxt/ui/components/Textarea.vue';
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import type { UIMessage } from 'ai';
import type { Message } from '@/domain/message';
import MessageContent from './MessageContent.vue';

const props = defineProps<{
  messages: Message[];
  thinking: boolean;
  highlighted?: string | null;
  readonly?: boolean;
}>();
const emit = defineEmits<{ edit: [messageId: string, content: string] }>();

const editingId = ref<string | null>(null);
const draft = ref('');

const uiMessages = computed<UIMessage[]>(() =>
  props.messages.map((message) => ({
    id: message.id,
    role: message.isFromAi ? 'assistant' : 'user',
    parts: [{ type: 'text', text: message.content }],
  })),
);

const { copy } = useClipboard();

const user = computed(() => ({
  side: 'right' as const,
  variant: 'soft' as const,
  actions: props.readonly
    ? undefined
    : [
        {
          label: 'Modifier',
          icon: 'i-lucide-pencil',
          'aria-label': 'Modifier ce message',
          onClick: (_event: MouseEvent, message: UIMessage) => startEdit(message),
        },
      ],
}));

const assistant = {
  side: 'left' as const,
  variant: 'naked' as const,
  avatar: { icon: 'i-lucide-sparkles' },
  actions: [
    {
      label: 'Copier',
      icon: 'i-lucide-copy',
      'aria-label': 'Copier la réponse',
      onClick: (_event: MouseEvent, message: UIMessage) => copy(textOf(message)),
    },
  ],
};

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
}

function startEdit(message: UIMessage) {
  editingId.value = message.id;
  draft.value = textOf(message);
}

function submitEdit(messageId: string) {
  const content = draft.value.trim();
  editingId.value = null;
  if (content) emit('edit', messageId, content);
}
</script>

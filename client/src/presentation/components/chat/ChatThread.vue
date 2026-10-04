<template>
  <UChatMessages
    class="chat-thread"
    :messages="uiMessages"
    :status="status"
    :user="user"
    :assistant="assistant"
    should-auto-scroll
  >
    <template #content="{ message }">
      <div
        :id="`message-${message.id}`"
        class="scroll-mt-24 rounded-xl"
        :class="{ 'found-flash': highlighted === message.id }"
      >
        <MessageContent
          v-if="message.role === 'assistant'"
          :content="textOf(message)"
          :reveal="message.id === revealId"
          @revealed="emit('revealed')"
        />
        <form
          v-else-if="editingId === message.id"
          class="edit-card flex flex-col gap-3 rounded-3xl bg-elevated px-5 pt-4 pb-3"
          @submit.prevent="submitEdit(message.id)"
          @keydown.esc="editingId = null"
        >
          <UTextarea
            v-model="draft"
            placeholder="Modifiez votre message..."
            aria-label="Modifier le message"
            variant="none"
            size="xl"
            autoresize
            autofocus
            :rows="1"
            :maxrows="12"
            class="w-full"
            :ui="{ base: 'p-0 leading-7' }"
            @keydown.enter.exact.prevent="submitEdit(message.id)"
          />
          <div class="flex justify-end gap-2">
            <UButton
              label="Annuler"
              color="neutral"
              variant="outline"
              class="rounded-full bg-default"
              @click="editingId = null"
            />
            <UButton
              type="submit"
              label="Envoyer"
              class="rounded-full"
              :disabled="!draft.trim() || draft.trim() === textOf(message)"
            />
          </div>
        </form>
        <p v-else class="whitespace-pre-wrap">{{ textOf(message) }}</p>
      </div>
    </template>

    <template #actions="{ message }">
      <template v-if="editingId !== message.id">
        <UTooltip
          v-if="message.role === 'assistant'"
          :text="copiedId === message.id ? 'Copié' : 'Copier'"
        >
          <UButton
            :icon="copiedId === message.id ? 'i-lucide-check' : 'i-lucide-copy'"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="copiedId === message.id ? 'Réponse copiée' : 'Copier la réponse'"
            @click="copyMessage(message)"
          />
        </UTooltip>
        <UTooltip v-else-if="!readonly" text="Modifier">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Modifier ce message"
            @click="startEdit(message)"
          />
        </UTooltip>
      </template>
    </template>

    <template #indicator>
      <div class="flex items-center gap-2 text-sm text-muted">
        <UChatShimmer text="MyGPT réfléchit…" />
      </div>
    </template>
  </UChatMessages>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UChatMessages from '@nuxt/ui/components/ChatMessages.vue';
import UChatShimmer from '@nuxt/ui/components/ChatShimmer.vue';
import UTextarea from '@nuxt/ui/components/Textarea.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { useToast } from '@nuxt/ui/composables';
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
  revealId?: string | null;
}>();
const emit = defineEmits<{ edit: [messageId: string, content: string]; revealed: [] }>();

// « streaming » pendant l'effet d'écriture : UChatMessages garde alors le bas du fil visible
const status = computed(() => {
  if (props.thinking) return 'submitted';
  return props.revealId ? 'streaming' : 'ready';
});

const editingId = ref<string | null>(null);
const draft = ref('');

const uiMessages = computed<UIMessage[]>(() =>
  props.messages.map((message) => ({
    id: message.id,
    role: message.isFromAi ? 'assistant' : 'user',
    parts: [{ type: 'text', text: message.content }],
  })),
);

const toast = useToast();
const { copy } = useClipboard();
const copiedId = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

const user = {
  side: 'right' as const,
  variant: 'soft' as const,
  ui: { root: 'message-in', content: 'rounded-3xl px-4 py-2.5' },
};

const assistant = {
  side: 'left' as const,
  variant: 'naked' as const,
  ui: { root: 'message-in' },
};

async function copyMessage(message: UIMessage) {
  try {
    await copy(textOf(message));
    copiedId.value = message.id;
    toast.add({ title: 'Réponse copiée', icon: 'i-lucide-check', duration: 2000 });
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copiedId.value = null), 2000);
  } catch {
    toast.add({ title: 'Impossible de copier la réponse', color: 'error' });
  }
}

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

<style scoped>
.edit-card {
  animation: message-in 0.2s ease-out;
}

/* Message trouvé par la recherche : zone arrondie qui déborde du message, avec un halo qui s'estompe */
.found-flash {
  position: relative;
  isolation: isolate;
}

.found-flash::before {
  content: '';
  position: absolute;
  inset: -1.25rem -1.75rem;
  z-index: -1;
  border-radius: 1.75rem;
  background: color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--ui-text-highlighted) 10%, transparent),
    0 12px 40px -12px color-mix(in oklab, var(--ui-text-highlighted) 25%, transparent);
  animation: found 2.6s ease-out forwards;
}

@keyframes found {
  0% {
    opacity: 0;
    transform: scale(0.97);
  }
  12%,
  65% {
    opacity: 1;
    transform: none;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .edit-card,
  .found-flash::before {
    animation: none;
  }
}
</style>

<style>
/* Non scoped : UChatMessages n'a pas de racine unique, l'attribut de portée ne s'y applique pas */
.chat-thread .message-in {
  animation: message-in 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

/* En modification, la bulle s'efface au profit d'une carte pleine largeur */
.chat-thread [data-slot='container']:has(.edit-card) {
  width: 100%;
  max-width: 100%;
}

.chat-thread [data-slot='body']:has(.edit-card) {
  width: 100%;
}

.chat-thread [data-slot='content']:has(.edit-card) {
  width: 100%;
  padding: 0;
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .chat-thread .message-in {
    animation: none;
  }
}
</style>

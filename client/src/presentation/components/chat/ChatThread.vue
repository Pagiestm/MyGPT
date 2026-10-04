<template>
  <div class="flex flex-col" :class="{ 'pb-8': unanswered }">
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
          class="scroll-mt-24 rounded-card"
          :class="{ 'found-flash': highlighted === message.id }"
        >
          <MessageContent
            v-if="message.role === 'assistant'"
            :content="textOf(message)"
            :streaming="message.id === STREAMING_ID"
          />
          <UChatPrompt
            v-else-if="editingId === message.id"
            v-model="draft"
            class="edit-card"
            placeholder="Modifiez votre message..."
            aria-label="Modifier le message"
            variant="soft"
            color="neutral"
            autofocus
            @submit="submitEdit(message.id)"
            @keydown.esc="editingId = null"
          >
            <template #footer>
              <span />
              <div class="flex gap-2">
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
            </template>
          </UChatPrompt>
          <div v-else class="flex flex-col gap-2">
            <MessageAttachments
              v-if="byId.get(message.id)?.attachments?.length"
              :attachments="byId.get(message.id)!.attachments!"
            />
            <p class="whitespace-pre-wrap">{{ textOf(message) }}</p>
          </div>
        </div>
      </template>

      <template #actions="{ message }">
        <template v-if="editingId !== message.id && message.id !== STREAMING_ID">
          <template v-if="message.role === 'assistant'">
            <UTooltip :text="copiedId === message.id ? 'Copié' : 'Copier'">
              <UButton
                :icon="copiedId === message.id ? 'i-lucide-check' : 'i-lucide-copy'"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="copiedId === message.id ? 'Réponse copiée' : 'Copier la réponse'"
                @click="copyMessage(message)"
              />
            </UTooltip>
            <UTooltip
              v-if="voice.supported"
              :text="voice.speakingId.value === message.id ? 'Arrêter la lecture' : 'Écouter'"
            >
              <UButton
                :icon="
                  voice.speakingId.value === message.id ? 'i-lucide-square' : 'i-lucide-volume-2'
                "
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="
                  voice.speakingId.value === message.id
                    ? 'Arrêter la lecture'
                    : 'Écouter la réponse'
                "
                @click="voice.toggle(message.id, textOf(message))"
              />
            </UTooltip>
            <UTooltip
              v-if="!readonly && phase === 'idle' && message.id === lastAnswerId"
              text="Régénérer"
            >
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Régénérer la réponse"
                @click="emit('regenerate')"
              />
            </UTooltip>
            <span v-if="modelLabel(message.id)" class="ms-1 text-xs text-dimmed">
              {{ modelLabel(message.id) }}
            </span>
          </template>
          <UTooltip v-else-if="!readonly && phase === 'idle'" text="Modifier">
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

    <div
      v-if="unanswered"
      class="message-in flex flex-wrap items-center gap-3 rounded-card border border-default px-4 py-3 text-sm"
      role="status"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 text-error" />
      <span class="flex-1 text-muted">La réponse n'a pas pu être générée.</span>
      <UButton
        icon="i-lucide-refresh-cw"
        label="Réessayer"
        size="sm"
        color="neutral"
        variant="outline"
        class="rounded-full"
        @click="emit('regenerate')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UChatMessages from '@nuxt/ui/components/ChatMessages.vue';
import UChatPrompt from '@nuxt/ui/components/ChatPrompt.vue';
import UChatShimmer from '@nuxt/ui/components/ChatShimmer.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import type { UIMessage } from 'ai';
import type { Message } from '@/domain/message';
import { STREAMING_ID } from '@/application/composables/useChatStream';
import { useModels } from '@/application/composables/useModels';
import { useReadAloud } from '@/presentation/composables/useReadAloud';
import MessageAttachments from './MessageAttachments.vue';
import MessageContent from './MessageContent.vue';

const props = withDefaults(
  defineProps<{
    messages: Message[];
    phase?: 'idle' | 'submitted' | 'streaming';
    highlighted?: string | null;
    readonly?: boolean;
  }>(),
  { phase: 'idle', highlighted: null, readonly: false },
);
const emit = defineEmits<{ edit: [messageId: string, content: string]; regenerate: [] }>();

const status = computed(() => (props.phase === 'idle' ? 'ready' : props.phase));

const editingId = ref<string | null>(null);
const draft = ref('');

const byId = computed(() => new Map(props.messages.map((message) => [message.id, message])));

// La réponse en attente reste masquée tant qu'elle est vide : l'indicateur « réfléchit » la remplace
const uiMessages = computed<UIMessage[]>(() =>
  props.messages
    .filter((message) => message.id !== STREAMING_ID || message.content)
    .map((message) => ({
      id: message.id,
      role: message.isFromAi ? 'assistant' : 'user',
      parts: [{ type: 'text', text: message.content }],
    })),
);

const lastAnswerId = computed(
  () => [...props.messages].reverse().find((message) => message.isFromAi)?.id,
);

const unanswered = computed(
  () => !props.readonly && props.phase === 'idle' && props.messages.at(-1)?.isFromAi === false,
);

const { data: models } = useModels();
function modelLabel(id: string) {
  const model = byId.value.get(id)?.model;
  return model ? (models.value?.models.find((item) => item.id === model)?.label ?? null) : null;
}

const toast = useToast();
const { copy } = useClipboard();
const copiedId = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

const voice = useReadAloud();

const user = {
  side: 'right' as const,
  variant: 'soft' as const,
  ui: { root: 'message-in', content: 'rounded-(--radius-panel) px-4 py-2.5' },
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
  border-radius: var(--radius-field);
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

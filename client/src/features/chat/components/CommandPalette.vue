<template>
  <UModal
    v-model:open="palette.isOpen.value"
    title="Rechercher"
    description="Conversations, messages et actions"
    :ui="{ content: 'sm:max-w-2xl', header: 'sr-only' }"
  >
    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :groups="groups"
        :loading="isLoading"
        placeholder="Rechercher une conversation, un message, une action…"
        close
        class="h-[min(32rem,70vh)]"
        @update:open="(value: boolean) => !value && palette.close()"
      >
        <template #empty>
          <p class="py-6 text-center text-sm text-muted">
            {{
              term.trim().length < 2
                ? 'Tapez au moins 2 caractères'
                : `Aucun résultat pour « ${term} »`
            }}
          </p>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import UCommandPalette from '@nuxt/ui/components/CommandPalette.vue';
import UModal from '@nuxt/ui/components/Modal.vue';
import { defineShortcuts } from '@nuxt/ui/composables';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { refDebounced, useColorMode } from '@vueuse/core';
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';
import { useConversationList } from '@/features/chat/composables/useConversations';
import { useGlobalMessageSearch } from '@/features/chat/composables/useMessages';
import { useCommandPalette } from '@/features/chat/composables/useCommandPalette';

const palette = useCommandPalette();
const router = useRouter();
const { store: colorMode } = useColorMode();

const term = ref('');
const debounced = refDebounced(term, 200);
const searching = computed(() => debounced.value.trim().length >= 2);

const { items: conversations, isLoading: loadingConversations } = useConversationList(() =>
  searching.value ? debounced.value : '',
);
const { items: messages, isLoading: loadingMessages } = useGlobalMessageSearch(debounced);
const isLoading = computed(() => loadingConversations.value || loadingMessages.value);

defineShortcuts({
  meta_k: { usingInput: true, handler: () => (palette.isOpen.value = !palette.isOpen.value) },
});

watch(palette.isOpen, (open) => {
  if (open) term.value = '';
});

const open = (id: string, messageId?: string) =>
  router.push({
    name: 'conversation',
    params: { id },
    hash: messageId ? `#message-${messageId}` : '',
  });

function excerpt(content: string) {
  const text = content.replace(/\s+/g, ' ');
  const index = text.toLowerCase().indexOf(debounced.value.trim().toLowerCase());
  const start = Math.max(0, index - 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 90)}${text.length > start + 90 ? '…' : ''}`;
}

const groups = computed<CommandPaletteGroup[]>(() => {
  const actions: CommandPaletteItem[] = [
    {
      label: 'Nouvelle conversation',
      icon: 'i-lucide-square-pen',
      onSelect: () => run(() => router.push({ name: 'new-chat' })),
    },
    {
      label: 'Archives',
      icon: 'i-lucide-archive',
      onSelect: () => run(() => router.push({ name: 'archives' })),
    },
    {
      label: 'Bibliothèque',
      icon: 'i-lucide-library',
      onSelect: () => run(() => router.push({ name: 'library' })),
    },
    {
      label: 'Réglages',
      icon: 'i-lucide-settings',
      onSelect: () => run(() => router.push({ name: 'settings' })),
    },
    {
      label: 'Thème clair',
      icon: 'i-lucide-sun',
      onSelect: () => run(() => (colorMode.value = 'light')),
    },
    {
      label: 'Thème sombre',
      icon: 'i-lucide-moon',
      onSelect: () => run(() => (colorMode.value = 'dark')),
    },
  ];

  if (!searching.value) {
    return [
      {
        id: 'recent',
        label: 'Conversations récentes',
        items: (conversations.value ?? []).slice(0, 6).map((conversation) => ({
          label: conversation.name,
          icon: conversation.pinned ? 'i-lucide-pin' : 'i-lucide-message-square',
          onSelect: () => run(() => open(conversation.id)),
        })),
      },
      { id: 'actions', label: 'Actions', items: actions },
    ];
  }

  return [
    {
      id: 'conversations',
      label: 'Conversations',
      ignoreFilter: true,
      items: (conversations.value ?? []).slice(0, 8).map((conversation) => ({
        label: conversation.name,
        icon: 'i-lucide-message-square',
        onSelect: () => run(() => open(conversation.id)),
      })),
    },
    {
      id: 'messages',
      label: 'Messages',
      ignoreFilter: true,
      items: (messages.value ?? []).map((message) => ({
        label: excerpt(message.content),
        suffix: message.conversation.name,
        icon: message.isFromAi ? 'i-lucide-sparkles' : 'i-lucide-user',
        onSelect: () => run(() => open(message.conversationId, message.id)),
      })),
    },
    { id: 'actions', label: 'Actions', items: actions },
  ];
});

function run(action: () => unknown) {
  palette.close();
  action();
}
</script>

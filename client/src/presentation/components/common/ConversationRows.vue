<template>
  <ul class="divide-y divide-default rounded-card border border-default">
    <li
      v-for="conversation in conversations"
      :key="conversation.id"
      class="flex items-center gap-3 p-4"
    >
      <UIcon :name="icon" class="size-5 shrink-0" :class="iconClass" />
      <RouterLink
        :to="{ name: 'conversation', params: { id: conversation.id } }"
        class="min-w-0 flex-1"
      >
        <p class="truncate font-medium text-highlighted">{{ conversation.name }}</p>
        <p class="text-sm text-muted">{{ detail(conversation) }}</p>
      </RouterLink>
      <slot name="actions" :conversation="conversation" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import type { Conversation } from '@/domain/conversation';

defineProps<{
  conversations: Conversation[];
  icon: string;
  iconClass?: string;
  detail: (conversation: Conversation) => string;
}>();
</script>

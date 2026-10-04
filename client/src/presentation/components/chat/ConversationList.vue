<template>
  <nav aria-label="Conversations" class="flex flex-col gap-4">
    <section v-for="group in groups" :key="group.label" class="flex flex-col gap-0.5">
      <h3 class="px-2 pb-1 text-xs font-medium text-dimmed">{{ group.label }}</h3>
      <div
        v-for="conversation in group.items"
        :key="conversation.id"
        class="group/item relative flex items-center rounded-md"
        :class="isActive(conversation.id) ? 'bg-elevated' : 'hover:bg-elevated/60'"
      >
        <RouterLink
          :to="`/chat/${conversation.id}`"
          class="min-w-0 flex-1 truncate px-2 py-1.5 text-sm"
          :class="isActive(conversation.id) ? 'font-medium text-highlighted' : 'text-toned'"
        >
          {{ conversation.name }}
        </RouterLink>
        <UDropdownMenu :items="menuItems(conversation)" :content="{ align: 'start' }">
          <UButton
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
            size="xs"
            class="mr-1 opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            :aria-label="`Actions pour ${conversation.name}`"
          />
        </UDropdownMenu>
      </div>
    </section>
  </nav>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { DropdownMenuItem } from '@nuxt/ui';
import { groupByRecency, type Conversation } from '@/domain/conversation';

const props = defineProps<{ conversations: Conversation[] }>();
const emit = defineEmits<{ delete: [conversation: Conversation] }>();

const route = useRoute();

function isActive(id: string) {
  return route.path === `/chat/${id}`;
}

const groups = computed(() => groupByRecency(props.conversations));

function menuItems(conversation: Conversation): DropdownMenuItem[] {
  return [
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete', conversation),
    },
  ];
}
</script>

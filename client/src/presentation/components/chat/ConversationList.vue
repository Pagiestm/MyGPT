<template>
  <nav aria-label="Conversations" class="flex flex-col gap-4">
    <section v-for="group in groups" :key="group.label" class="flex flex-col gap-0.5">
      <h3 class="px-2 pb-1 text-xs font-medium text-dimmed">{{ group.label }}</h3>
      <div
        v-for="conversation in group.items"
        :key="conversation.id"
        class="group/item relative flex items-center rounded-md"
        :class="isActive(conversation.id) ? 'bg-accented/70' : 'hover:bg-accented/40'"
      >
        <form
          v-if="renamingId === conversation.id"
          class="flex-1 p-0.5"
          @submit.prevent="submitRename(conversation)"
        >
          <UInput
            v-model="draft"
            autofocus
            size="sm"
            class="w-full"
            aria-label="Nouveau nom"
            @keydown.esc="renamingId = null"
            @blur="submitRename(conversation)"
          />
        </form>
        <RouterLink
          v-else
          :to="{ name: 'conversation', params: { id: conversation.id } }"
          class="min-w-0 flex-1 truncate px-2 py-1.5 text-sm"
          :class="isActive(conversation.id) ? 'font-medium text-highlighted' : 'text-toned'"
        >
          {{ conversation.name }}
        </RouterLink>
        <UDropdownMenu
          v-if="renamingId !== conversation.id"
          :items="menuItems(conversation)"
          :content="menuContent"
        >
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
import UInput from '@nuxt/ui/components/Input.vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { DropdownMenuItem } from '@nuxt/ui';
import { groupByRecency, type Conversation } from '@/domain/conversation';

const props = defineProps<{ conversations: Conversation[] }>();
const emit = defineEmits<{
  delete: [conversation: Conversation];
  rename: [conversation: Conversation, name: string];
}>();

const renamingId = ref<string | null>(null);

// Le menu ne reprend pas le focus en se fermant : sinon le champ de renommage
// perdrait le focus aussitôt ouvert et se refermerait (validation au blur)
const menuContent = {
  align: 'start' as const,
  onCloseAutoFocus: (event: Event) => event.preventDefault(),
};
const draft = ref('');

function submitRename(conversation: Conversation) {
  if (renamingId.value !== conversation.id) return;
  renamingId.value = null;
  const name = draft.value.trim();
  if (name && name !== conversation.name) emit('rename', conversation, name);
}

const route = useRoute();

function isActive(id: string) {
  return route.path === `/chat/${id}`;
}

const groups = computed(() => groupByRecency(props.conversations));

function menuItems(conversation: Conversation): DropdownMenuItem[] {
  return [
    {
      label: 'Renommer',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        draft.value = conversation.name;
        renamingId.value = conversation.id;
      },
    },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete', conversation),
    },
  ];
}
</script>

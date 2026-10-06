<template>
  <div>
    <div class="group/folder flex items-center rounded-md hover:bg-accented/40">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-start text-sm text-toned"
        :aria-label="`Dossier ${folder.name}`"
        :aria-expanded="open"
        @click="open = !open"
      >
        <UIcon
          :name="open ? 'i-lucide-folder-open' : 'i-lucide-folder'"
          class="size-4 shrink-0 text-muted"
        />
        <span class="truncate">{{ folder.name }}</span>
        <span class="ms-auto text-xs text-dimmed tabular-nums">{{ conversations.length }}</span>
      </button>
      <UDropdownMenu :items="menu" :content="{ align: 'start' }">
        <UButton
          icon="i-lucide-ellipsis"
          color="neutral"
          variant="ghost"
          size="xs"
          class="mr-1 opacity-0 group-hover/folder:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          :aria-label="`Actions pour le dossier ${folder.name}`"
        />
      </UDropdownMenu>
    </div>

    <UCollapsible v-model:open="open" :unmount-on-hide="false">
      <template #content>
        <div class="ms-3 flex flex-col gap-0.5 border-s border-default ps-2">
          <p v-if="!conversations.length" class="px-2 py-1 text-xs text-dimmed">
            Aucune conversation
          </p>
          <ConversationItem
            v-for="conversation in conversations"
            :key="conversation.id"
            :conversation="conversation"
            :folders="folders"
            @update="(patch) => emit('update', conversation, patch)"
            @delete="emit('deleteConversation', conversation)"
          />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UCollapsible from '@nuxt/ui/components/Collapsible.vue';
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { Conversation, ConversationPatch } from '@/features/chat/types/conversation';
import type { Folder } from '@/features/folders';
import ConversationItem from './ConversationItem.vue';

const props = defineProps<{ folder: Folder; conversations: Conversation[]; folders: Folder[] }>();
const emit = defineEmits<{
  edit: [];
  delete: [];
  update: [conversation: Conversation, patch: ConversationPatch];
  deleteConversation: [conversation: Conversation];
}>();

const route = useRoute();
const router = useRouter();

const open = ref(props.conversations.some((c) => c.id === route.params.id));
watch(
  () => route.params.id,
  (id) => {
    if (props.conversations.some((c) => c.id === id)) open.value = true;
  },
);

const menu = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Nouvelle conversation ici',
      icon: 'i-lucide-square-pen',
      onSelect: () => router.push({ name: 'new-chat', query: { folder: props.folder.id } }),
    },
    { label: 'Modifier le dossier', icon: 'i-lucide-settings-2', onSelect: () => emit('edit') },
  ],
  [
    {
      label: 'Supprimer le dossier',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete'),
    },
  ],
]);
</script>

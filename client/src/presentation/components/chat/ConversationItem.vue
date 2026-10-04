<template>
  <div
    class="group/item relative flex items-center rounded-md"
    :class="active ? 'bg-accented/70' : 'hover:bg-accented/40'"
  >
    <form v-if="renaming" class="flex-1 p-0.5" @submit.prevent="submitRename">
      <UInput
        v-model="draft"
        autofocus
        size="sm"
        class="w-full"
        aria-label="Nouveau nom"
        @keydown.esc="renaming = false"
        @blur="submitRename"
      />
    </form>
    <RouterLink
      v-else
      :to="{ name: 'conversation', params: { id: conversation.id } }"
      class="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-sm"
      :class="active ? 'font-medium text-highlighted' : 'text-toned'"
    >
      <UIcon v-if="conversation.pinned" name="i-lucide-pin" class="size-3 shrink-0 text-dimmed" />
      <span class="truncate">{{ conversation.name }}</span>
    </RouterLink>
    <UDropdownMenu v-if="!renaming" :items="menu" :content="menuContent">
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
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { Conversation, ConversationPatch } from '@/domain/conversation';
import type { Folder } from '@/domain/folder';

const props = defineProps<{ conversation: Conversation; folders: Folder[] }>();
const emit = defineEmits<{ update: [patch: ConversationPatch]; delete: [] }>();

const route = useRoute();
const active = computed(() => route.params.id === props.conversation.id);

const renaming = ref(false);
const draft = ref('');

// Le menu ne reprend pas le focus en se fermant : sinon le champ de renommage
// perdrait le focus aussitôt ouvert et se refermerait (validation au blur)
const menuContent = {
  align: 'start' as const,
  onCloseAutoFocus: (event: Event) => event.preventDefault(),
};

function submitRename() {
  if (!renaming.value) return;
  renaming.value = false;
  const name = draft.value.trim();
  if (name && name !== props.conversation.name) emit('update', { name });
}

const menu = computed<DropdownMenuItem[][]>(() => {
  const { conversation, folders } = props;
  return [
    [
      {
        label: 'Renommer',
        icon: 'i-lucide-pencil',
        onSelect: () => {
          draft.value = conversation.name;
          renaming.value = true;
        },
      },
      {
        label: conversation.pinned ? 'Désépingler' : 'Épingler',
        icon: conversation.pinned ? 'i-lucide-pin-off' : 'i-lucide-pin',
        onSelect: () => emit('update', { pinned: !conversation.pinned }),
      },
      {
        label: 'Déplacer vers',
        icon: 'i-lucide-folder-input',
        children: [
          ...folders.map((folder) => ({
            label: folder.name,
            icon: 'i-lucide-folder',
            type: 'checkbox' as const,
            checked: conversation.folderId === folder.id,
            onSelect: () => emit('update', { folderId: folder.id }),
          })),
          {
            label: 'Aucun dossier',
            icon: 'i-lucide-folder-x',
            disabled: !conversation.folderId,
            onSelect: () => emit('update', { folderId: null }),
          },
        ],
      },
      {
        label: 'Archiver',
        icon: 'i-lucide-archive',
        onSelect: () => emit('update', { archived: true }),
      },
    ],
    [
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => emit('delete'),
      },
    ],
  ];
});
</script>

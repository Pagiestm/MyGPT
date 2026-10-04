<template>
  <nav aria-label="Conversations" class="flex flex-col gap-5">
    <template v-if="flat">
      <ConversationItem
        v-for="conversation in conversations"
        :key="conversation.id"
        :conversation="conversation"
        :folders="folders"
        @update="(patch) => emit('update', conversation, patch)"
        @delete="emit('delete', conversation)"
      />
    </template>

    <template v-else>
      <section v-if="sections.pinned.length" class="flex flex-col gap-0.5" aria-label="Épinglées">
        <h3 class="px-2 pb-1 text-xs font-medium text-dimmed">Épinglées</h3>
        <ConversationItem
          v-for="conversation in sections.pinned"
          :key="conversation.id"
          :conversation="conversation"
          :folders="folders"
          @update="(patch) => emit('update', conversation, patch)"
          @delete="emit('delete', conversation)"
        />
      </section>

      <section class="flex flex-col gap-0.5" aria-label="Dossiers">
        <div class="flex items-center justify-between px-2 pb-1">
          <h3 class="text-xs font-medium text-dimmed">Dossiers</h3>
          <UButton
            icon="i-lucide-folder-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Nouveau dossier"
            @click="emit('createFolder')"
          />
        </div>
        <p v-if="!folders.length" class="px-2 text-xs text-dimmed">
          Regroupez vos conversations et donnez-leur des consignes communes.
        </p>
        <FolderGroup
          v-for="folder in folders"
          :key="folder.id"
          :folder="folder"
          :conversations="sections.byFolder.get(folder.id) ?? []"
          :folders="folders"
          @edit="emit('editFolder', folder)"
          @delete="emit('deleteFolder', folder)"
          @update="(conversation, patch) => emit('update', conversation, patch)"
          @delete-conversation="(conversation) => emit('delete', conversation)"
        />
      </section>

      <section
        v-for="group in sections.recent"
        :key="group.label"
        class="flex flex-col gap-0.5"
        :aria-label="group.label"
      >
        <h3 class="px-2 pb-1 text-xs font-medium text-dimmed">{{ group.label }}</h3>
        <ConversationItem
          v-for="conversation in group.items"
          :key="conversation.id"
          :conversation="conversation"
          :folders="folders"
          @update="(patch) => emit('update', conversation, patch)"
          @delete="emit('delete', conversation)"
        />
      </section>
    </template>
  </nav>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import { computed } from 'vue';
import { organize, type Conversation, type ConversationPatch } from '@/domain/conversation';
import type { Folder } from '@/domain/folder';
import ConversationItem from './ConversationItem.vue';
import FolderGroup from './FolderGroup.vue';

const props = defineProps<{ conversations: Conversation[]; folders: Folder[]; flat?: boolean }>();
const emit = defineEmits<{
  update: [conversation: Conversation, patch: ConversationPatch];
  delete: [conversation: Conversation];
  createFolder: [];
  editFolder: [folder: Folder];
  deleteFolder: [folder: Folder];
}>();

const sections = computed(() =>
  organize(
    props.conversations,
    props.folders.map((folder) => folder.id),
  ),
);
</script>

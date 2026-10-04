<template>
  <div class="flex min-h-0 flex-1 flex-col gap-5">
    <nav class="flex flex-col gap-0.5" aria-label="Navigation principale">
      <UButton
        :to="{ name: 'new-chat' }"
        icon="i-lucide-square-pen"
        label="Nouvelle conversation"
        color="neutral"
        variant="ghost"
        class="justify-start"
      />
      <UButton
        icon="i-lucide-search"
        color="neutral"
        variant="ghost"
        class="justify-start"
        aria-keyshortcuts="Control+K"
        @click="palette.open()"
      >
        Rechercher
        <span class="ms-auto flex gap-0.5">
          <UKbd value="meta" size="sm" />
          <UKbd value="K" size="sm" />
        </span>
      </UButton>
      <UButton
        :to="{ name: 'library' }"
        icon="i-lucide-library"
        label="Bibliothèque"
        color="neutral"
        variant="ghost"
        class="justify-start"
      />
      <UButton
        :to="{ name: 'archives' }"
        icon="i-lucide-archive"
        label="Archives"
        color="neutral"
        variant="ghost"
        class="justify-start"
      />
      <UInput
        v-model="keyword"
        icon="i-lucide-list-filter"
        placeholder="Rechercher une conversation"
        aria-label="Rechercher une conversation"
        variant="ghost"
        class="w-full"
      />
    </nav>

    <div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      <div v-if="isPending" class="flex flex-col gap-2 px-2">
        <USkeleton v-for="n in 6" :key="n" class="h-6 w-full" />
      </div>
      <p
        v-else-if="keyword && !conversations?.length"
        class="px-2 py-6 text-center text-sm text-muted"
      >
        Aucune conversation trouvée
      </p>
      <ConversationList
        v-else
        :conversations="conversations ?? []"
        :folders="folders ?? []"
        :flat="!!debouncedKeyword"
        @update="update"
        @delete="toDelete = $event"
        @create-folder="openFolder(null)"
        @edit-folder="openFolder"
        @delete-folder="folderToDelete = $event"
      />
    </div>

    <FolderModal v-model:open="folderModalOpen" :folder="editedFolder" />

    <ConfirmModal
      :open="toDelete !== null"
      title="Supprimer la conversation ?"
      :description="`« ${toDelete?.name} » et tous ses messages seront définitivement supprimés.`"
      confirm-label="Supprimer"
      :loading="isDeleting"
      @update:open="toDelete = null"
      @confirm="confirmDelete"
    />

    <ConfirmModal
      :open="folderToDelete !== null"
      title="Supprimer le dossier ?"
      :description="`Le dossier « ${folderToDelete?.name} » sera supprimé. Ses conversations sont conservées.`"
      confirm-label="Supprimer le dossier"
      :loading="isDeletingFolder"
      @update:open="folderToDelete = null"
      @confirm="confirmDeleteFolder"
    />
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import UKbd from '@nuxt/ui/components/Kbd.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import type { Conversation, ConversationPatch } from '@/domain/conversation';
import type { Folder } from '@/domain/folder';
import {
  useConversationList,
  useDeleteConversation,
  useUpdateConversation,
} from '@/application/composables/useConversations';
import { useDeleteFolder, useFolders } from '@/application/composables/useFolders';
import ConfirmModal from '@/presentation/components/common/ConfirmModal.vue';
import { useCommandPalette } from '@/presentation/composables/useCommandPalette';
import ConversationList from './ConversationList.vue';
import FolderModal from './FolderModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const palette = useCommandPalette();

const keyword = ref('');
const debouncedKeyword = refDebounced(keyword, 250);
const { data: conversations, isPending } = useConversationList(debouncedKeyword);
const { data: folders } = useFolders();

const { mutateAsync: updateConversation } = useUpdateConversation();
const { mutateAsync: deleteConversation, isLoading: isDeleting } = useDeleteConversation();
const { mutateAsync: deleteFolder, isLoading: isDeletingFolder } = useDeleteFolder();

const toDelete = ref<Conversation | null>(null);
const folderToDelete = ref<Folder | null>(null);
const folderModalOpen = ref(false);
const editedFolder = ref<Folder | null>(null);

function openFolder(folder: Folder | null) {
  editedFolder.value = folder;
  folderModalOpen.value = true;
}

const feedback: Partial<Record<keyof ConversationPatch, (patch: ConversationPatch) => string>> = {
  pinned: (patch) => (patch.pinned ? 'Conversation épinglée' : 'Conversation désépinglée'),
  archived: () => 'Conversation archivée',
  folderId: (patch) =>
    patch.folderId
      ? `Déplacée dans « ${folders.value?.find((f) => f.id === patch.folderId)?.name} »`
      : 'Retirée du dossier',
};

async function update(conversation: Conversation, patch: ConversationPatch) {
  try {
    await updateConversation({ id: conversation.id, patch });
    const field = Object.keys(patch)[0] as keyof ConversationPatch;
    const message = feedback[field]?.(patch);
    if (message) toast.add({ title: message, color: 'success', duration: 2500 });
    if (patch.archived && route.params.id === conversation.id) {
      await router.push({ name: 'new-chat' });
    }
  } catch {
    toast.add({ title: 'La conversation n’a pas pu être modifiée', color: 'error' });
  }
}

async function confirmDelete() {
  if (!toDelete.value) return;
  const { id } = toDelete.value;
  try {
    await deleteConversation(id);
    toast.add({ title: 'Conversation supprimée', color: 'success' });
    if (route.params.id === id) await router.push({ name: 'new-chat' });
  } catch {
    toast.add({ title: 'Impossible de supprimer la conversation', color: 'error' });
  } finally {
    toDelete.value = null;
  }
}

async function confirmDeleteFolder() {
  if (!folderToDelete.value) return;
  try {
    await deleteFolder(folderToDelete.value.id);
    toast.add({ title: 'Dossier supprimé', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de supprimer le dossier', color: 'error' });
  } finally {
    folderToDelete.value = null;
  }
}
</script>

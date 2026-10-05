<template>
  <UDashboardPanel id="archives">
    <template #header>
      <UDashboardNavbar title="Archives" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-6 py-6 sm:max-w-3xl">
        <p class="text-muted">
          Les conversations archivées n'apparaissent plus dans la barre latérale. Restaurez-les à
          tout moment.
        </p>

        <div v-if="isPending" class="flex flex-col gap-3">
          <USkeleton v-for="n in 3" :key="n" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!archived?.length"
          icon="i-lucide-archive"
          title="Aucune conversation archivée"
          description="Archivez une conversation depuis son menu dans la barre latérale."
        />

        <ConversationRows
          v-else
          :conversations="archived"
          icon="i-lucide-archive"
          icon-class="text-muted"
          :detail="(conversation) => `Dernière activité le ${formatDate(conversation.updatedAt)}`"
        >
          <template #actions="{ conversation }">
            <UButton
              icon="i-lucide-archive-restore"
              label="Restaurer"
              color="neutral"
              variant="ghost"
              :aria-label="`Restaurer ${conversation.name}`"
              :ui="{ label: 'max-sm:hidden' }"
              @click="restore(conversation)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              :aria-label="`Supprimer ${conversation.name}`"
              @click="toDelete = conversation"
            />
          </template>
        </ConversationRows>

        <LoadMore :has-more="hasMore" :loading="loadingMore" @more="loadMore()" />
      </UContainer>

      <ConfirmModal
        :open="toDelete !== null"
        title="Supprimer la conversation ?"
        :description="`« ${toDelete?.name} » et tous ses messages seront définitivement supprimés.`"
        confirm-label="Supprimer"
        :loading="isDeleting"
        @update:open="toDelete = null"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UEmpty from '@nuxt/ui/components/Empty.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { ref } from 'vue';
import type { Conversation } from '@/domain/conversation';
import {
  useArchivedConversations,
  useDeleteConversation,
  useUpdateConversation,
} from '@/application/composables/useConversations';
import ConfirmModal from '@/presentation/components/common/ConfirmModal.vue';
import ConversationRows from '@/presentation/components/common/ConversationRows.vue';
import LoadMore from '@/presentation/components/common/LoadMore.vue';

const toast = useToast();

const { items: archived, isPending, hasMore, loadMore, loadingMore } = useArchivedConversations();
const { mutateAsync: updateConversation } = useUpdateConversation();
const { mutateAsync: deleteConversation, isLoading: isDeleting } = useDeleteConversation();
const toDelete = ref<Conversation | null>(null);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

async function restore(conversation: Conversation) {
  try {
    await updateConversation({ id: conversation.id, patch: { archived: false } });
    toast.add({ title: 'Conversation restaurée', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de restaurer la conversation', color: 'error' });
  }
}

async function confirmDelete() {
  if (!toDelete.value) return;
  try {
    await deleteConversation(toDelete.value.id);
    toast.add({ title: 'Conversation supprimée', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de supprimer la conversation', color: 'error' });
  } finally {
    toDelete.value = null;
  }
}
</script>

<template>
  <UDashboardPanel id="trash">
    <template #header>
      <UDashboardNavbar title="Corbeille" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-6 py-6 sm:max-w-3xl">
        <p class="text-muted">
          Les conversations supprimées restent ici trente jours, puis disparaissent définitivement.
        </p>

        <div v-if="isLoading" class="flex flex-col gap-3">
          <USkeleton v-for="n in 3" :key="n" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!items.length"
          icon="i-lucide-trash-2"
          title="La corbeille est vide"
          description="Les conversations que vous supprimez atterrissent ici."
        />

        <ConversationRows
          v-else
          :conversations="items"
          icon="i-lucide-trash-2"
          icon-class="text-muted"
          :detail="(conversation) => `Supprimée le ${formatDate(conversation.updatedAt)}`"
        >
          <template #actions="{ conversation }">
            <UButton
              icon="i-lucide-undo-2"
              label="Restaurer"
              color="neutral"
              variant="ghost"
              :aria-label="`Restaurer ${conversation.name}`"
              :ui="{ label: 'max-sm:hidden' }"
              @click="restoreOne(conversation)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              :aria-label="`Supprimer définitivement ${conversation.name}`"
              @click="askPurge(conversation)"
            />
          </template>
        </ConversationRows>

        <BaseLoadMore :has-more="hasMore" :loading="loadingMore" @more="loadMore()" />
      </UContainer>
    </template>
  </UDashboardPanel>

  <BaseConfirmModal
    :open="confirming"
    title="Supprimer définitivement ?"
    :description="`« ${pending?.name ?? ''} » et tous ses messages seront effacés. Cette action est irréversible.`"
    confirm-label="Supprimer définitivement"
    @update:open="confirming = $event"
    @confirm="purgeOne"
  />
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
import BaseConfirmModal from '@/shared/ui/BaseConfirmModal.vue';
import BaseLoadMore from '@/shared/ui/BaseLoadMore.vue';
import { getErrorMessage } from '@/shared/lib/http';
import type { Conversation } from '../types/conversation';
import {
  usePurgeConversation,
  useRestoreConversation,
  useTrashedConversations,
} from '../composables/useConversations';
import ConversationRows from '../components/ConversationRows.vue';

const toast = useToast();
const { items, isLoading, hasMore, loadMore, loadingMore } = useTrashedConversations();
const { mutateAsync: restore } = useRestoreConversation();
const { mutateAsync: purge } = usePurgeConversation();

const confirming = ref(false);
const pending = ref<Conversation | null>(null);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });
}

async function restoreOne(conversation: Conversation) {
  try {
    await restore(conversation.id);
    toast.add({ title: `« ${conversation.name} » a été restaurée`, color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Restauration impossible'), color: 'error' });
  }
}

function askPurge(conversation: Conversation) {
  pending.value = conversation;
  confirming.value = true;
}

async function purgeOne() {
  if (!pending.value) return;
  try {
    await purge(pending.value.id);
    toast.add({ title: 'Conversation supprimée définitivement', color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Suppression impossible'), color: 'error' });
  } finally {
    pending.value = null;
  }
}
</script>

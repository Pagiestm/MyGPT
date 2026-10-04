<template>
  <UDashboardPanel id="library">
    <template #header>
      <UDashboardNavbar title="Bibliothèque" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-6 py-6 sm:max-w-3xl">
        <p class="text-muted">
          Les conversations partagées par d'autres personnes que vous avez enregistrées.
        </p>

        <div v-if="isPending" class="flex flex-col gap-3">
          <USkeleton v-for="n in 3" :key="n" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!saved?.length"
          icon="i-lucide-library"
          title="Votre bibliothèque est vide"
          description="Ouvrez un lien de partage et choisissez « Enregistrer dans ma bibliothèque »."
        />

        <ConversationRows
          v-else
          :conversations="saved"
          icon="i-lucide-bookmark"
          icon-class="text-primary"
          :detail="(conversation) => `Enregistrée le ${formatDate(conversation.createdAt)}`"
        >
          <template #actions="{ conversation }">
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              :aria-label="`Retirer ${conversation.name} de la bibliothèque`"
              @click="toDelete = conversation"
            />
          </template>
        </ConversationRows>
      </UContainer>

      <ConfirmModal
        :open="toDelete !== null"
        title="Retirer de la bibliothèque ?"
        :description="`Votre copie de « ${toDelete?.name} » sera supprimée. La conversation d'origine n'est pas affectée.`"
        confirm-label="Retirer"
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
  useDeleteConversation,
  useSavedConversations,
} from '@/application/composables/useConversations';
import ConfirmModal from '@/presentation/components/common/ConfirmModal.vue';
import ConversationRows from '@/presentation/components/common/ConversationRows.vue';

const toast = useToast();

const { data: saved, isPending } = useSavedConversations();
const { mutateAsync: deleteConversation, isLoading: isDeleting } = useDeleteConversation();
const toDelete = ref<Conversation | null>(null);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'long' });

async function confirmDelete() {
  if (!toDelete.value) return;
  try {
    await deleteConversation(toDelete.value.id);
    toast.add({ title: 'Conversation retirée de votre bibliothèque', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de retirer la conversation', color: 'error' });
  } finally {
    toDelete.value = null;
  }
}
</script>

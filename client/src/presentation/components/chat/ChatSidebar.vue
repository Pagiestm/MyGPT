<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <UButton to="/chat" icon="i-lucide-square-pen" block>Nouvelle conversation</UButton>

    <UInput
      v-model="keyword"
      icon="i-lucide-search"
      placeholder="Rechercher une conversation"
      aria-label="Rechercher une conversation"
      variant="soft"
      class="w-full"
    />

    <div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      <div v-if="isPending" class="flex flex-col gap-2 px-2">
        <USkeleton v-for="n in 6" :key="n" class="h-6 w-full" />
      </div>
      <p v-else-if="!conversations?.length" class="px-2 py-6 text-center text-sm text-muted">
        {{ keyword ? 'Aucune conversation trouvée' : 'Aucune conversation pour le moment' }}
      </p>
      <ConversationList v-else :conversations="conversations" @delete="toDelete = $event" />
    </div>

    <ConfirmModal
      :open="toDelete !== null"
      title="Supprimer la conversation ?"
      :description="`« ${toDelete?.name} » et tous ses messages seront définitivement supprimés.`"
      confirm-label="Supprimer"
      :loading="isDeleting"
      @update:open="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import type { Conversation } from '@/domain/conversation';
import ConfirmModal from '@/presentation/components/common/ConfirmModal.vue';
import {
  useConversationList,
  useDeleteConversation,
} from '@/application/composables/useConversations';
import ConversationList from './ConversationList.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const keyword = ref('');
const debouncedKeyword = refDebounced(keyword, 250);
const { data: conversations, isPending } = useConversationList(debouncedKeyword);

const toDelete = ref<Conversation | null>(null);
const { mutateAsync: deleteConversation, isLoading: isDeleting } = useDeleteConversation();

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
</script>

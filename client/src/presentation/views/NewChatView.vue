<template>
  <UDashboardPanel id="new-chat">
    <template #header>
      <UDashboardNavbar
        :title="folder ? folder.name : 'Nouvelle conversation'"
        :ui="{ root: 'border-none' }"
      >
        <template v-if="folder" #leading>
          <UIcon name="i-lucide-folder" class="size-4 text-muted" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex flex-1 flex-col justify-center gap-6 pb-[15vh] sm:max-w-3xl">
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
            Bonjour {{ auth.user?.pseudo }}, que puis-je faire pour vous ?
          </h1>
          <p v-if="folder" class="text-sm text-muted">
            Nouvelle conversation dans « {{ folder.name }} »
            <template v-if="folder.instructions">, avec les consignes du dossier</template>
          </p>
        </div>

        <ChatComposer
          v-model="input"
          v-model:model="model"
          :phase="isLoading ? 'submitted' : 'idle'"
          @submit="start"
        />

        <div class="flex flex-wrap justify-center gap-2">
          <UButton
            v-for="suggestion in suggestions"
            :key="suggestion.label"
            :icon="suggestion.icon"
            :label="suggestion.label"
            color="neutral"
            variant="outline"
            size="sm"
            class="rounded-full"
            @click="input = suggestion.prompt"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Attachment } from '@/domain/attachment';
import { useAuthStore } from '@/application/stores/auth.store';
import { useCreateConversation } from '@/application/composables/useConversations';
import { useFolders } from '@/application/composables/useFolders';
import { setPendingPrompt } from '@/application/composables/usePendingPrompt';
import ChatComposer from '@/presentation/components/chat/ChatComposer.vue';
import { suggestions } from '@/presentation/constants/suggestions';
import { useDraftPrompt } from '@/presentation/composables/useDraftPrompt';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { mutateAsync: createConversation, isLoading } = useCreateConversation();
const { data: folders } = useFolders();

const { take: takeDraft } = useDraftPrompt();
const input = ref(takeDraft());
const model = ref<string>();

const folder = computed(() => {
  const id = route.query.folder;
  return typeof id === 'string' ? (folders.value?.find((item) => item.id === id) ?? null) : null;
});

async function start({ content, attachments }: { content: string; attachments: Attachment[] }) {
  if (isLoading.value) return;
  try {
    const conversation = await createConversation({ prompt: content, folderId: folder.value?.id });
    setPendingPrompt(conversation.id, { content, attachments, model: model.value });
    await router.push({ name: 'conversation', params: { id: conversation.id } });
  } catch {
    input.value = content;
    toast.add({ title: 'Impossible de créer la conversation', color: 'error' });
  }
}
</script>

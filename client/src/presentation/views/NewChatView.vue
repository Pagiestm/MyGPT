<template>
  <UDashboardPanel id="new-chat">
    <template #header>
      <UDashboardNavbar title="Nouvelle conversation" :ui="{ root: 'border-none' }" />
    </template>

    <template #body>
      <UContainer class="flex flex-1 flex-col justify-center gap-6 pb-[15vh] sm:max-w-3xl">
        <h1 class="text-center text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          Bonjour {{ auth.user?.pseudo }}, que puis-je faire pour vous ?
        </h1>

        <UChatPrompt
          v-model="input"
          placeholder="Écrivez votre message..."
          variant="outline"
          color="neutral"
          :loading="isLoading"
          @submit="start"
        >
          <UChatPromptSubmit
            class="rounded-full"
            :status="isLoading ? 'submitted' : 'ready'"
            aria-label="Envoyer le message"
          />
        </UChatPrompt>

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
import UChatPrompt from '@nuxt/ui/components/ChatPrompt.vue';
import UChatPromptSubmit from '@nuxt/ui/components/ChatPromptSubmit.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import { useToast } from '@nuxt/ui/composables';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/application/stores/auth.store';
import { useCreateConversation } from '@/application/composables/useConversations';
import { setPendingPrompt } from '@/application/composables/usePendingPrompt';
import { suggestions } from '@/presentation/constants/suggestions';
import { useDraftPrompt } from '@/presentation/composables/useDraftPrompt';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { mutateAsync: createConversation, isLoading } = useCreateConversation();

const { take: takeDraft } = useDraftPrompt();
const input = ref(takeDraft());

async function start() {
  const prompt = input.value.trim();
  if (!prompt || isLoading.value) return;

  try {
    const conversation = await createConversation(prompt);
    setPendingPrompt(conversation.id, prompt);
    input.value = '';
    await router.push({ name: 'conversation', params: { id: conversation.id } });
  } catch {
    toast.add({ title: 'Impossible de créer la conversation', color: 'error' });
  }
}
</script>

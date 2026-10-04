<template>
  <UContainer class="flex flex-col gap-8 py-10 sm:max-w-3xl">
    <div v-if="isPending" class="flex flex-col gap-4">
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-32 w-full" />
    </div>

    <UEmpty
      v-else-if="error"
      icon="i-lucide-link-2-off"
      title="Ce lien de partage n'est plus valide"
      description="Il a peut-être expiré ou été désactivé par son auteur."
      :actions="homeAction"
      class="py-24"
    />

    <template v-else-if="conversation">
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-default pb-6">
        <div class="flex min-w-0 flex-col gap-2">
          <UBadge
            label="Conversation partagée"
            variant="subtle"
            icon="i-lucide-share-2"
            class="self-start"
          />
          <h1 class="text-2xl font-semibold text-balance text-highlighted">
            {{ conversation.name }}
          </h1>
          <p class="text-sm text-muted">Partagée par {{ conversation.user.pseudo }}</p>
        </div>
        <UButton
          v-if="auth.isAuthenticated"
          icon="i-lucide-bookmark-plus"
          :loading="isSaving"
          @click="save"
        >
          Enregistrer dans ma bibliothèque
        </UButton>
        <UButton
          v-else
          :to="{ name: 'login', query: { redirect: route.fullPath } }"
          icon="i-lucide-log-in"
        >
          Se connecter pour l'enregistrer
        </UButton>
      </header>

      <ChatThread :messages="messages" :thinking="false" readonly />
    </template>
  </UContainer>
</template>

<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UEmpty from '@nuxt/ui/components/Empty.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ButtonProps } from '@nuxt/ui';
import { sortByDate } from '@/domain/message';
import { useAuthStore } from '@/application/stores/auth.store';
import {
  useSaveSharedConversation,
  useSharedConversation,
} from '@/application/composables/useConversations';
import ChatThread from '@/presentation/components/chat/ChatThread.vue';

const props = defineProps<{ link: string }>();

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const homeAction: ButtonProps[] = [
  { label: "Retour à l'accueil", to: '/', color: 'neutral', variant: 'subtle' },
];

const { data: conversation, error, isPending } = useSharedConversation(() => props.link);
const { mutateAsync: saveShared, isLoading: isSaving } = useSaveSharedConversation();

const messages = computed(() => sortByDate(conversation.value?.messages ?? []));

async function save() {
  if (!conversation.value) return;
  try {
    const saved = await saveShared({ conversationId: conversation.value.id, link: props.link });
    toast.add({ title: 'Conversation ajoutée à votre bibliothèque', color: 'success' });
    await router.push({ name: 'conversation', params: { id: saved.id } });
  } catch {
    toast.add({ title: "Impossible d'enregistrer cette conversation", color: 'error' });
  }
}
</script>

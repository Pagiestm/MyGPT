<template>
  <UModal
    v-model:open="open"
    title="Partager la conversation"
    description="Toute personne disposant du lien peut lire la conversation, sans compte."
  >
    <UButton
      icon="i-lucide-share-2"
      color="neutral"
      variant="ghost"
      aria-label="Partager la conversation"
    />

    <template #body>
      <div v-if="link" class="flex flex-col gap-4">
        <UFieldGroup class="w-full">
          <UInput :model-value="url" readonly aria-label="Lien de partage" class="flex-1" />
          <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            color="neutral"
            variant="subtle"
            @click="copy(url)"
          >
            {{ copied ? 'Copié' : 'Copier' }}
          </UButton>
        </UFieldGroup>
        <p class="text-sm text-muted">{{ expirationLabel }}</p>
      </div>

      <UFormField v-else label="Durée de validité du lien">
        <URadioGroup v-model="duration" :items="durations" orientation="horizontal" />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-between gap-2">
        <UButton
          v-if="link"
          color="error"
          variant="ghost"
          :loading="revoke.isLoading.value"
          @click="onRevoke"
        >
          Désactiver le lien
        </UButton>
        <span v-else />
        <UButton v-if="!link" :loading="share.isLoading.value" @click="onShare">
          Créer le lien
        </UButton>
        <UButton v-else color="neutral" variant="subtle" @click="open = false">Fermer</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import UModal from '@nuxt/ui/components/Modal.vue';
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { activeShareLink, type Conversation } from '@/domain/conversation';
import { useShareConversation } from '@/application/composables/useConversations';

const props = defineProps<{ conversation: Conversation }>();

const toast = useToast();
const { copy, copied } = useClipboard();
const { share, revoke } = useShareConversation(() => props.conversation.id);

const open = ref(false);
const duration = ref('never');
const durations = [
  { label: 'Sans limite', value: 'never' },
  { label: '24 heures', value: '1' },
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' },
];

const link = computed(() => activeShareLink(props.conversation));
const url = computed(() => `${window.location.origin}/s/${link.value}`);

const expirationLabel = computed(() => {
  const expires = props.conversation.shareExpiresAt;
  if (!expires) return "Ce lien n'expire pas.";
  const date = new Date(expires).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  return `Ce lien expire le ${date}.`;
});

async function onShare() {
  try {
    const shared = await share.mutateAsync(Number(duration.value) || null);
    await copy(`${window.location.origin}/s/${shared.shareLink}`);
    toast.add({ title: 'Lien créé et copié', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de créer le lien de partage', color: 'error' });
  }
}

async function onRevoke() {
  try {
    await revoke.mutateAsync();
    toast.add({ title: 'Le lien de partage est désactivé', color: 'success' });
  } catch {
    toast.add({ title: 'Impossible de désactiver le lien', color: 'error' });
  }
}
</script>

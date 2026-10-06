<template>
  <UForm :schema="preferencesSchema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
    <UFormField
      label="Consignes personnalisées"
      name="customInstructions"
      description="Ce que l'assistant doit savoir sur vous ou sur la façon de répondre. Appliqué à toutes vos conversations."
      :hint="`${state.customInstructions.length}/2000`"
    >
      <UTextarea
        v-model="state.customInstructions"
        :rows="5"
        autoresize
        :maxrows="12"
        placeholder="Ex. Je suis développeur web. Réponds de façon concise, avec des exemples en TypeScript."
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Modèle par défaut"
      name="preferredModel"
      description="Utilisé pour les nouvelles conversations, modifiable à chaque message."
    >
      <USelect
        :model-value="state.preferredModel ?? undefined"
        :items="modelItems"
        :loading="!models"
        placeholder="Choisi par le serveur"
        class="w-full sm:w-64"
        :ui="{ value: 'truncate' }"
        @update:model-value="(value) => (state.preferredModel = value ?? null)"
      />
    </UFormField>

    <div>
      <UButton type="submit" :loading="isLoading" :disabled="!changed">Enregistrer</UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import USelect from '@nuxt/ui/components/Select.vue';
import UTextarea from '@nuxt/ui/components/Textarea.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { preferencesSchema, type PreferencesInput } from '../types';
import { getErrorMessage } from '@/shared/lib/http';
import { useAuthStore } from '@/features/auth';
import { useUpdatePreferences } from '@/features/account/composables/useAccount';
import { useModels } from '@/features/models';

const auth = useAuthStore();
const toast = useToast();
const { data: models } = useModels();
const { mutateAsync: updatePreferences, isLoading } = useUpdatePreferences();

const state = reactive<PreferencesInput>({
  customInstructions: auth.user?.customInstructions ?? '',
  preferredModel: auth.user?.preferredModel ?? null,
});

const modelItems = computed(() =>
  (models.value?.models ?? []).map((model) => ({ value: model.id, label: model.label })),
);

const changed = computed(
  () =>
    state.customInstructions.trim() !== (auth.user?.customInstructions ?? '') ||
    state.preferredModel !== (auth.user?.preferredModel ?? null),
);

async function onSubmit(event: FormSubmitEvent<PreferencesInput>) {
  try {
    await updatePreferences(event.data);
    toast.add({ title: 'Vos préférences ont été enregistrées', color: 'success' });
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'Impossible d’enregistrer vos préférences'),
      color: 'error',
    });
  }
}
</script>

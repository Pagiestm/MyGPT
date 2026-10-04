<template>
  <UForm :schema="profileSchema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
    <UFormField label="Email" description="L'email ne peut pas être modifié.">
      <UInput :model-value="auth.user?.email" disabled class="w-full" />
    </UFormField>
    <UFormField label="Pseudo" name="pseudo">
      <UInput v-model="state.pseudo" class="w-full" />
    </UFormField>
    <div>
      <UButton type="submit" :loading="isLoading" :disabled="state.pseudo === auth.user?.pseudo">
        Enregistrer
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { profileSchema, type ProfileInput } from '@/domain/user';
import { getErrorMessage } from '@/infrastructure/http/client';
import { useAuthStore } from '@/application/stores/auth.store';
import { useUpdatePseudo } from '@/application/composables/useAccount';

const auth = useAuthStore();
const toast = useToast();
const { mutateAsync: updatePseudo, isLoading } = useUpdatePseudo();

const state = reactive({ pseudo: auth.user?.pseudo ?? '' });

async function onSubmit(event: FormSubmitEvent<ProfileInput>) {
  try {
    await updatePseudo(event.data.pseudo);
    toast.add({ title: 'Votre pseudo a été mis à jour', color: 'success' });
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'Impossible de mettre à jour le pseudo'),
      color: 'error',
    });
  }
}
</script>

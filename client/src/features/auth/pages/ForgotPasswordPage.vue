<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">Mot de passe oublié</h1>
      <p class="text-sm text-muted">
        Indiquez votre email : nous vous enverrons un lien pour en choisir un nouveau.
      </p>
    </div>

    <UAlert
      v-if="sent"
      color="success"
      variant="subtle"
      icon="i-lucide-mail-check"
      title="Demande envoyée"
      description="Si un compte existe pour cet email, un lien vient de lui être envoyé. Il est valable une heure."
    />

    <UForm v-else :schema="forgotPasswordSchema" :state="state" class="space-y-5" @submit="submit">
      <UFormField label="Email" name="email">
        <UInput
          v-model="state.email"
          size="xl"
          type="email"
          autocomplete="email"
          placeholder="nom@exemple.com"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        block
        size="xl"
        class="rounded-full"
        :loading="isLoading"
        label="Envoyer le lien"
      />
    </UForm>

    <p class="text-center text-sm text-muted">
      <ULink to="/login">Revenir à la connexion</ULink>
    </p>
  </div>
</template>

<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import ULink from '@nuxt/ui/components/Link.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, ref } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { getErrorMessage } from '@/shared/lib/http';
import { useForgotPassword } from '@/features/account';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/account';

const toast = useToast();
const { mutateAsync: request, isLoading } = useForgotPassword();

const state = reactive<ForgotPasswordInput>({ email: '' });
const sent = ref(false);

async function submit(event: FormSubmitEvent<ForgotPasswordInput>) {
  try {
    await request(event.data.email);
    sent.value = true;
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Demande impossible'), color: 'error' });
  }
}
</script>

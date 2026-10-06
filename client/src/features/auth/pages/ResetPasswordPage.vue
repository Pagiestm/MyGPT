<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">Nouveau mot de passe</h1>
      <p class="text-sm text-muted">Choisissez un mot de passe que vous n'utilisez pas ailleurs.</p>
    </div>

    <UForm :schema="resetPasswordSchema" :state="state" class="space-y-5" @submit="submit">
      <UFormField label="Nouveau mot de passe" name="password">
        <PasswordInput v-model="state.password" autocomplete="new-password" />
        <PasswordChecklist :password="state.password" class="mt-2" />
      </UFormField>
      <UButton
        type="submit"
        block
        size="xl"
        class="rounded-full"
        :loading="isLoading"
        label="Enregistrer"
      />
    </UForm>

    <p class="text-center text-sm text-muted">
      <ULink to="/login">Revenir à la connexion</ULink>
    </p>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import ULink from '@nuxt/ui/components/Link.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui';
import { getErrorMessage } from '@/shared/lib/http';
import { useResetPassword } from '@/features/account';
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/account';
import PasswordChecklist from '../components/PasswordChecklist.vue';
import PasswordInput from '../components/PasswordInput.vue';

const props = defineProps<{ token: string }>();

const toast = useToast();
const router = useRouter();
const { mutateAsync: reset, isLoading } = useResetPassword();

const state = reactive<ResetPasswordInput>({ password: '' });

async function submit(event: FormSubmitEvent<ResetPasswordInput>) {
  try {
    await reset({ token: props.token, password: event.data.password });
    toast.add({ title: 'Mot de passe enregistré, vous pouvez vous connecter', color: 'success' });
    await router.push('/login');
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Lien expiré ou déjà utilisé'), color: 'error' });
  }
}
</script>

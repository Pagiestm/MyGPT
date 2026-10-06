<template>
  <div class="flex flex-col gap-6">
    <UForm
      :schema="changeEmailSchema"
      :state="emailState"
      class="flex flex-col gap-4"
      @submit="submitEmail"
    >
      <UFormField label="Email" name="email" description="Sert à vous connecter.">
        <UInput v-model="emailState.email" type="email" autocomplete="email" class="w-full" />
      </UFormField>
      <UFormField label="Mot de passe actuel" name="password">
        <PasswordInput v-model="emailState.password" autocomplete="current-password" />
      </UFormField>
      <div>
        <UButton type="submit" :loading="changingEmail" :disabled="!emailChanged">
          Changer d'email
        </UButton>
      </div>
    </UForm>

    <USeparator />

    <UForm
      :schema="changePasswordSchema"
      :state="passwordState"
      class="flex flex-col gap-4"
      @submit="submitPassword"
    >
      <UFormField label="Mot de passe actuel" name="currentPassword">
        <PasswordInput v-model="passwordState.currentPassword" autocomplete="current-password" />
      </UFormField>
      <UFormField label="Nouveau mot de passe" name="newPassword">
        <PasswordInput v-model="passwordState.newPassword" autocomplete="new-password" />
        <PasswordChecklist :password="passwordState.newPassword" class="mt-2" />
      </UFormField>
      <div>
        <UButton type="submit" :loading="changingPassword" :disabled="!passwordState.newPassword">
          Changer de mot de passe
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import USeparator from '@nuxt/ui/components/Separator.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { PasswordChecklist, PasswordInput, useAuthStore } from '@/features/auth';
import { getErrorMessage } from '@/shared/lib/http';
import { useChangeEmail, useChangePassword } from '../composables/useAccount';
import {
  changeEmailSchema,
  changePasswordSchema,
  type ChangeEmailInput,
  type ChangePasswordInput,
} from '../types';

const auth = useAuthStore();
const toast = useToast();
const { mutateAsync: changeEmail, isLoading: changingEmail } = useChangeEmail();
const { mutateAsync: changePassword, isLoading: changingPassword } = useChangePassword();

const emailState = reactive<ChangeEmailInput>({ email: auth.user?.email ?? '', password: '' });
const passwordState = reactive<ChangePasswordInput>({ currentPassword: '', newPassword: '' });

const emailChanged = computed(() => emailState.email !== (auth.user?.email ?? ''));

async function submitEmail(event: FormSubmitEvent<ChangeEmailInput>) {
  try {
    await changeEmail(event.data);
    emailState.password = '';
    toast.add({ title: 'Votre email a été changé', color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Changement impossible'), color: 'error' });
  }
}

async function submitPassword(event: FormSubmitEvent<ChangePasswordInput>) {
  try {
    await changePassword(event.data);
    Object.assign(passwordState, { currentPassword: '', newPassword: '' });
    toast.add({ title: 'Votre mot de passe a été changé', color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Changement impossible'), color: 'error' });
  }
}
</script>

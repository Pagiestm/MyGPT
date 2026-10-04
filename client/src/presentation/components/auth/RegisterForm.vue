<template>
  <UForm :schema="registerSchema" :state="state" class="space-y-5" @submit="onSubmit">
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

    <UFormField label="Pseudo" name="pseudo" help="Visible sur les conversations que vous partagez">
      <UInput
        v-model="state.pseudo"
        size="xl"
        autocomplete="username"
        placeholder="Entre 3 et 20 caractères"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Mot de passe" name="password">
      <PasswordInput v-model="state.password" autocomplete="new-password" />
    </UFormField>
    <PasswordChecklist :password="state.password" />

    <UButton
      type="submit"
      block
      size="xl"
      class="rounded-full"
      :loading="loading"
      label="S'inscrire"
    />
  </UForm>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui';
import { getErrorMessage } from '@/infrastructure/http/client';
import { useAuthStore } from '@/application/stores/auth.store';
import { registerSchema, type RegisterInput } from '@/domain/user';
import PasswordChecklist from './PasswordChecklist.vue';
import PasswordInput from './PasswordInput.vue';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const state = reactive({ email: '', pseudo: '', password: '' });
const loading = ref(false);

async function onSubmit(event: FormSubmitEvent<RegisterInput>) {
  loading.value = true;
  try {
    await auth.register(event.data);
    toast.add({
      title: 'Inscription réussie !',
      description: 'Vous pouvez vous connecter.',
      color: 'success',
    });
    await router.push({ name: 'login', query: { email: event.data.email } });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, "L'inscription a échoué."), color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

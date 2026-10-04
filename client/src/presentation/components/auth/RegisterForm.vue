<template>
  <UForm :schema="registerSchema" :state="state" class="space-y-5" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
    </UFormField>

    <UFormField label="Pseudo" name="pseudo" help="Entre 3 et 20 caractères">
      <UInput v-model="state.pseudo" autocomplete="username" class="w-full" />
    </UFormField>

    <UFormField
      label="Mot de passe"
      name="password"
      help="10 caractères minimum, dont une majuscule, un chiffre et un caractère spécial"
    >
      <UInput v-model="state.password" type="password" autocomplete="new-password" class="w-full" />
    </UFormField>

    <UButton type="submit" block :loading="loading">S'inscrire</UButton>
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
    await router.push('/login');
  } catch (error) {
    toast.add({ title: getErrorMessage(error, "L'inscription a échoué."), color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

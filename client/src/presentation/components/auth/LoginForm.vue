<template>
  <UForm :schema="loginSchema" :state="state" class="space-y-5" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
    </UFormField>

    <UFormField label="Mot de passe" name="password">
      <UInput
        v-model="state.password"
        type="password"
        autocomplete="current-password"
        class="w-full"
      />
    </UFormField>

    <UButton type="submit" block :loading="loading">Se connecter</UButton>
  </UForm>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui';
import { getErrorMessage } from '@/infrastructure/http/client';
import { useAuthStore } from '@/application/stores/auth.store';
import { loginSchema, type LoginInput } from '@/domain/user';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const state = reactive({ email: '', password: '' });
const loading = ref(false);

async function onSubmit(event: FormSubmitEvent<LoginInput>) {
  loading.value = true;
  try {
    await auth.login(event.data);
    toast.add({ title: 'Connexion réussie !', color: 'success' });
    const redirect = route.query.redirect;
    await router.push(typeof redirect === 'string' ? redirect : '/chat');
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'Échec de la connexion. Vérifiez vos identifiants.'),
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UForm :schema="loginSchema" :state="state" class="space-y-5" @submit="onSubmit">
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

    <UFormField label="Mot de passe" name="password">
      <PasswordInput v-model="state.password" autocomplete="current-password" />
      <template v-if="byEmail" #hint>
        <ULink to="/mot-de-passe-oublie" class="text-xs">Mot de passe oublié ?</ULink>
      </template>
    </UFormField>

    <UCheckbox
      v-model="state.remember"
      name="remember"
      label="Rester connecté"
      description="Trente jours au lieu d'une heure. À éviter sur un appareil partagé."
    />

    <UButton
      type="submit"
      block
      size="xl"
      class="rounded-full"
      :loading="loading"
      label="Se connecter"
    />
  </UForm>

  <GoogleSignIn label="Se connecter avec Google" />
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UCheckbox from '@nuxt/ui/components/Checkbox.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui';
import { getErrorMessage } from '@/shared/lib/http';
import { useAuthStore } from '../stores/auth.store';
import { loginSchema, type LoginInput } from '../types';
import ULink from '@nuxt/ui/components/Link.vue';
import { usePasswordRecovery } from '@/features/account';
import PasswordInput from './PasswordInput.vue';
import GoogleSignIn from './GoogleSignIn.vue';

const auth = useAuthStore();
const { byEmail } = usePasswordRecovery();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const state = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  password: '',
  remember: false,
});
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

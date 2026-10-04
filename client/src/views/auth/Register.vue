<template>
  <AuthLayout
    title="Inscription"
    subtitle="Créez votre compte personnel"
    footer-text="Vous avez déjà un compte ?"
    footer-link="/login"
    footer-link-text="Se connecter"
    security-badge-text="Inscription sécurisée"
  >
    <form class="space-y-6" @submit.prevent="onSubmit">
      <InputForm
        v-model="form.email.$value"
        label-value="Email"
        input-name="email"
        type="email"
        placeholder="votre@email.com"
        :error-state="showError('email')"
        :error-message="form.email.$error?.message"
        @blur="touchedFields.email = true"
      />

      <InputForm
        v-model="form.pseudo.$value"
        label-value="Pseudo"
        input-name="pseudo"
        type="text"
        placeholder="pseudo42"
        :error-state="showError('pseudo')"
        :error-message="form.pseudo.$error?.message"
        @blur="touchedFields.pseudo = true"
      />

      <InputForm
        v-model="form.password.$value"
        label-value="Mot de passe"
        input-name="password"
        type="password"
        placeholder="••••••••••"
        :error-state="showError('password')"
        :error-message="form.password.$error?.message"
        @blur="touchedFields.password = true"
      />

      <div>
        <SubmitButton
          :loading="isLoading"
          text="S'inscrire"
          loading-text="Inscription en cours..."
        />
      </div>
    </form>
  </AuthLayout>
  <LoadingOverlay :show="isLoading" message="Inscription en cours..." />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Database from '../../utils/database.utils';
import InputForm from '../../components/form/InputForm.vue';
import { useToast } from 'vue-toastification';
import SubmitButton from '../../components/form/SubmitButton.vue';
import AuthLayout from '../../components/layout/AuthLoyout.vue';
import LoadingOverlay from '../../components/LoadingOverlay.vue';
import { defineForm, field, isValidForm } from 'vue-yup-form';
import * as yup from 'yup';
import { userErrorMessages } from '../../utils/errors/auth/users';

const toast = useToast();
const router = useRouter();
const isLoading = ref(false);
const formError = ref('');
const formSubmitted = ref(false);

const touchedFields = reactive({
  email: false,
  pseudo: false,
  password: false,
});

type FormFields = 'email' | 'pseudo' | 'password';

const showError = (fieldName: FormFields) =>
  (touchedFields[fieldName] || formSubmitted.value) && !!form[fieldName].$error;

const form = defineForm({
  email: field(
    '',
    yup.string().required(userErrorMessages.required.email).email(userErrorMessages.format.email),
  ),

  pseudo: field(
    '',
    yup
      .string()
      .required(userErrorMessages.required.pseudo)
      .min(3, userErrorMessages.length.pseudo)
      .max(30, userErrorMessages.length.pseudo),
  ),

  password: field(
    '',
    yup
      .string()
      .required(userErrorMessages.required.password)
      .min(10, userErrorMessages.length.password)
      .matches(userErrorMessages.patterns.password, userErrorMessages.password.invalid),
  ),
});

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response: { status: number; data?: { message?: string } };
      }
    ).response;
    const status = response.status;
    const message = response.data?.message;

    return status in userErrorMessages.apiErrors
      ? message || userErrorMessages.apiErrors[status as keyof typeof userErrorMessages.apiErrors]
      : userErrorMessages.apiErrors.unknown;
  }

  return userErrorMessages.apiErrors.unknown;
}

async function onSubmit() {
  formSubmitted.value = true;
  if (!(await isValidForm(form))) return;

  isLoading.value = true;
  formError.value = '';

  try {
    const userData = {
      email: form.email.$value.trim(),
      pseudo: form.pseudo.$value.trim(),
      password: form.password.$value,
    };

    await Database.create('users/register', userData);

    toast.success('Inscription réussie !');
    router.push('/login');
  } catch (error) {
    formError.value = getErrorMessage(error);
    toast.error(formError.value);
  } finally {
    isLoading.value = false;
  }
}
</script>

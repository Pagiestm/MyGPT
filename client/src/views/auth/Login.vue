<template>
    <AuthLayout
        title="Connexion"
        subtitle="Accédez à votre espace personnel"
        footer-text="Pas encore de compte ?"
        footer-link="/register"
        footer-link-text="Créer un compte"
        security-badge-text="Connexion sécurisée"
    >
        <form class="space-y-6" @submit.prevent="handleLogin">
            <!-- Email -->
            <InputForm
                v-model="form.email.$value"
                label-value="Email"
                input-name="email"
                type="email"
                placeholder="votre@email.com"
                :error-state="showError('email')"
                :error-message="form.email.$error?.message"
                @blur="touchedFields.email = true"
            >
            </InputForm>

            <!-- Mot de passe -->
            <div class="mb-4">
                <label for="password" class="block text-gray-700"
                    >Mot de passe</label
                >
                <InputForm
                    v-model="form.password.$value"
                    label-value=""
                    input-name="password"
                    type="password"
                    placeholder="••••••••••"
                    :error-state="showError('password')"
                    :error-message="form.password.$error?.message"
                    @blur="touchedFields.password = true"
                >
                </InputForm>
            </div>

            <!-- Bouton de connexion -->
            <div>
                <SubmitButton
                    :loading="isLoading"
                    text="Se connecter"
                    loading-text="Connexion en cours..."
                />
            </div>
        </form>
    </AuthLayout>
    <LoadingOverlay :show="isLoading" message="Connexion en cours..." />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '../../stores/auth';
import LoadingOverlay from '../../components/LoadingOverlay.vue';
import InputForm from '../../components/form/InputForm.vue';
import SubmitButton from '../../components/form/SubmitButton.vue';
import AuthLayout from '../../components/layout/AuthLoyout.vue';
import { defineForm, field, isValidForm } from 'vue-yup-form';
import * as yup from 'yup';
import { userErrorMessages } from '../../utils/errors/auth/users';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const isLoading = ref(false);
const formError = ref('');
const formSubmitted = ref(false);

const touchedFields = reactive({
    email: false,
    password: false
});

type FormFields = 'email' | 'password';

const showError = (fieldName: FormFields) =>
    (touchedFields[fieldName] || formSubmitted.value) &&
    !!form[fieldName].$error;

const form = defineForm({
    email: field(
        '',
        yup
            .string()
            .required(userErrorMessages.required.email)
            .email(userErrorMessages.format.email)
    ),

    password: field(
        '',
        yup
            .string()
            .required(userErrorMessages.required.password)
            .min(10, userErrorMessages.length.password)
            .matches(
                userErrorMessages.patterns.password,
                userErrorMessages.password.invalid
            )
    )
});

/**
 * Récupère le message d'erreur basé sur le statut HTTP
 */
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
            ? message ||
                  userErrorMessages.apiErrors[
                      status as keyof typeof userErrorMessages.apiErrors
                  ]
            : userErrorMessages.apiErrors.unknown;
    }

    return userErrorMessages.apiErrors.unknown;
}

async function handleLogin() {
    formSubmitted.value = true;
    formError.value = '';

    if (!(await isValidForm(form))) return;

    isLoading.value = true;

    try {
        authStore.error = null;

        const result = await authStore.login({
            email: form.email.$value.trim(),
            password: form.password.$value
        });

        if (result) {
            toast.success('Connexion réussie !');

            // Vérifie s'il y a un paramètre de redirection
            const redirectPath = route.query.redirect;
            if (redirectPath) {
                router.push(redirectPath.toString());
            } else {
                router.push('/chat');
            }
        } else {
            formError.value = userErrorMessages.auth.invalidCredentials;
            toast.error(formError.value);
        }
    } catch (error) {
        formError.value = getErrorMessage(error);
        toast.error(formError.value);
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-3xl font-semibold tracking-tight text-highlighted">Connexion</h1>
      <p class="text-sm text-muted">Accédez à votre espace personnel</p>
    </div>
    <LoginForm />
    <p class="text-center text-sm text-muted">
      Pas encore de compte ?
      <ULink
        :to="{ name: 'register' }"
        class="font-medium text-highlighted underline underline-offset-4"
        >Créer un compte</ULink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue';
import LoginForm from '@/features/auth/components/LoginForm.vue';
</script>

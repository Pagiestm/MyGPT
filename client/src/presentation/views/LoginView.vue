<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">Connexion</h1>
      <p class="text-sm text-muted">Accédez à votre espace personnel</p>
    </div>
    <LoginForm />
    <p class="text-center text-sm text-muted">
      Pas encore de compte ?
      <ULink to="/register" class="font-medium text-primary">Créer un compte</ULink>
    </p>
  </div>
</template>

<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue';
import LoginForm from '@/presentation/components/auth/LoginForm.vue';
</script>

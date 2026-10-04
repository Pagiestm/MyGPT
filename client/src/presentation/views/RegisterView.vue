<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">Inscription</h1>
      <p class="text-sm text-muted">Créez votre compte personnel</p>
    </div>
    <RegisterForm />
    <p class="text-center text-sm text-muted">
      Déjà inscrit ?
      <ULink to="/login" class="font-medium text-primary">Se connecter</ULink>
    </p>
  </div>
</template>

<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue';
import RegisterForm from '@/presentation/components/auth/RegisterForm.vue';
</script>

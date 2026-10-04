<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="text-3xl font-semibold tracking-tight text-highlighted">Inscription</h1>
      <p class="text-sm text-muted">Créez votre compte personnel</p>
    </div>
    <RegisterForm />
    <p class="text-center text-sm text-muted">
      Déjà inscrit ?
      <ULink
        :to="{ name: 'login' }"
        class="font-medium text-highlighted underline underline-offset-4"
        >Se connecter</ULink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import ULink from '@nuxt/ui/components/Link.vue';
import RegisterForm from '@/presentation/components/auth/RegisterForm.vue';
</script>

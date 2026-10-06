<template>
  <UContainer
    class="flex min-h-[60dvh] flex-col items-center justify-center gap-4 py-24 text-center"
  >
    <p class="font-mono text-sm text-primary">Erreur 404</p>
    <h1 class="text-3xl font-semibold text-highlighted">Cette page n'existe pas</h1>
    <p class="text-muted">Le lien est peut-être incorrect, ou la page a été déplacée.</p>
    <UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="subtle"
      >Retour à l'accueil</UButton
    >
  </UContainer>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
</script>

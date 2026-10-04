<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted px-4 py-12">
    <RouterLink to="/" aria-label="Retour à l'accueil">
      <AppLogo :size="36" text-class="text-xl" />
    </RouterLink>
    <UCard class="w-full max-w-sm" :ui="{ body: 'sm:p-8' }">
      <slot />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue';
import AppLogo from '@/presentation/components/common/AppLogo.vue';
</script>

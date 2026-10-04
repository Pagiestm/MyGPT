<template>
  <section id="privacy" class="border-t border-default px-4 py-20">
    <div class="mx-auto flex max-w-5xl flex-col gap-12">
      <div v-reveal class="flex max-w-2xl flex-col gap-3">
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          Vos conversations restent les vôtres
        </h2>
        <p class="text-lg text-muted">Rien n'est public tant que vous ne l'avez pas décidé.</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div
          v-for="(point, index) in points"
          :key="point.title"
          v-reveal="index * 90"
          class="flex flex-col gap-3 rounded-2xl border border-default p-6 transition-colors duration-300 hover:bg-muted"
        >
          <UIcon :name="point.icon" class="size-5 text-highlighted" />
          <h3 class="font-semibold text-highlighted">{{ point.title }}</h3>
          <p class="text-sm text-muted">{{ point.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';

const points = [
  {
    icon: 'i-lucide-lock',
    title: 'Privé par défaut',
    description:
      'Seul votre compte accède à vos conversations. La session expire au bout d’une heure.',
  },
  {
    icon: 'i-lucide-link-2-off',
    title: 'Partage révocable',
    description: 'Un lien de partage peut expirer automatiquement ou être désactivé en un clic.',
  },
  {
    icon: 'i-lucide-trash-2',
    title: 'Suppression complète',
    description: 'Supprimer votre compte efface toutes vos conversations et vos messages.',
  },
];
</script>

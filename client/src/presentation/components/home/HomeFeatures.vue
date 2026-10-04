<template>
  <section id="features" class="border-t border-default px-4 py-20">
    <div class="mx-auto flex max-w-5xl flex-col gap-12">
      <div v-reveal class="flex max-w-2xl flex-col gap-3">
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          Tout ce qu'il faut, rien de plus
        </h2>
        <p class="text-lg text-muted">Les fonctions utiles au quotidien, sans réglage.</p>
      </div>

      <div class="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(feature, index) in features"
          :key="feature.title"
          v-reveal="(index % 3) * 90"
          class="group flex flex-col gap-2"
        >
          <span
            class="grid size-9 place-items-center rounded-tile border border-default bg-default shadow-xs transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-sm"
          >
            <UIcon :name="feature.icon" class="size-4.5 text-highlighted" />
          </span>
          <h3 class="mt-2 font-semibold text-highlighted">{{ feature.title }}</h3>
          <p class="text-sm text-muted">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';

const features = [
  {
    icon: 'i-lucide-message-square-text',
    title: 'Des réponses lisibles',
    description: 'Titres, listes, tableaux et code coloré, copiable en un clic.',
  },
  {
    icon: 'i-lucide-pencil',
    title: 'Questions modifiables',
    description: 'Corrigez une question déjà posée : la réponse est régénérée.',
  },
  {
    icon: 'i-lucide-history',
    title: 'Historique complet',
    description: 'Chaque conversation est gardée, classée par date et renommable.',
  },
  {
    icon: 'i-lucide-search',
    title: 'Recherche',
    description: 'Retrouvez une conversation par son titre, ou un message précis.',
  },
  {
    icon: 'i-lucide-link',
    title: 'Partage en un lien',
    description: 'Lecture seule, sans compte, avec une date d’expiration si besoin.',
  },
  {
    icon: 'i-lucide-sun-moon',
    title: 'Clair ou sombre',
    description: 'L’interface suit votre système, sur ordinateur comme sur mobile.',
  },
];
</script>

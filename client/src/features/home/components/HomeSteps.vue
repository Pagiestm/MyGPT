<template>
  <section id="how" class="border-t border-default px-4 py-20">
    <div class="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_2fr]">
      <div v-reveal class="flex flex-col gap-3">
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          Prêt en une minute
        </h2>
        <p class="text-muted">Pas d'installation, pas de carte bancaire.</p>
      </div>

      <ol class="flex flex-col">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          v-reveal="index * 90"
          class="flex gap-5 border-b border-default py-6 first:pt-0 last:border-none"
        >
          <span class="w-6 shrink-0 text-sm font-medium text-dimmed tabular-nums">
            {{ index + 1 }}.
          </span>
          <div class="flex flex-col gap-1">
            <h3 class="font-semibold text-highlighted">{{ step.title }}</h3>
            <p class="text-sm text-muted">{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    title: 'Créez votre compte',
    description: 'Un email, un pseudo et un mot de passe suffisent.',
  },
  {
    title: 'Choisissez un modèle',
    description: 'Du plus léger au plus capable. Il se télécharge une fois, puis reste en cache.',
  },
  {
    title: 'Posez votre première question',
    description: 'La réponse est générée dans votre navigateur, sans quitter votre machine.',
  },
  {
    title: 'Ajoutez vos documents',
    description: 'L’assistant s’en sert pour répondre, pour tout le compte ou un dossier.',
  },
  {
    title: 'Partagez si vous le souhaitez',
    description: 'Un lien en lecture seule, que vous pouvez désactiver à tout moment.',
  },
];
</script>

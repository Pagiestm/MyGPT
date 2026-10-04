<template>
  <section id="how" class="border-y border-default bg-muted py-24">
    <UContainer class="flex flex-col gap-12">
      <div class="flex max-w-2xl flex-col gap-3">
        <p class="font-mono text-sm text-primary">Comment ça marche</p>
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted sm:text-4xl">
          Trois étapes, une minute.
        </h2>
      </div>

      <ol class="steps grid gap-10 md:grid-cols-3 md:gap-6">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="step relative flex flex-col gap-3"
        >
          <span
            class="grid size-10 place-items-center rounded-full border border-default bg-default font-mono text-sm text-highlighted"
          >
            {{ index + 1 }}
          </span>
          <h3 class="text-lg font-semibold text-highlighted">{{ step.title }}</h3>
          <p class="text-muted">{{ step.description }}</p>
        </li>
      </ol>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import UContainer from '@nuxt/ui/components/Container.vue';

const steps = [
  {
    title: 'Créez votre compte',
    description: 'Un email, un pseudo et un mot de passe suffisent.',
  },
  {
    title: 'Posez votre question',
    description: 'Écrivez comme vous parlez. MyGPT répond en quelques secondes.',
  },
  {
    title: 'Gardez et partagez',
    description: 'Chaque conversation est enregistrée et peut être partagée par lien.',
  },
];
</script>

<style scoped>
@media (min-width: 48rem) {
  .step:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 1.25rem;
    left: 3.25rem;
    right: 0.75rem;
    border-top: 1px dashed var(--ui-border-accented);
  }
}
</style>

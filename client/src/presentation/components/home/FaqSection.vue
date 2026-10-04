<template>
  <section id="faq" class="py-24">
    <UContainer class="grid gap-10 lg:grid-cols-[1fr_2fr]">
      <div class="flex flex-col gap-3">
        <p class="font-mono text-sm text-primary">FAQ</p>
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          Questions fréquentes
        </h2>
      </div>
      <UAccordion :items="faq" />
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';
import UAccordion from '@nuxt/ui/components/Accordion.vue';
import UContainer from '@nuxt/ui/components/Container.vue';

const faq: AccordionItem[] = [
  {
    label: 'Quel modèle utilise MyGPT ?',
    content: "MyGPT utilise l'API Gemini de Google pour générer les réponses.",
  },
  {
    label: 'Mes conversations sont-elles privées ?',
    content:
      "Oui. Une conversation n'est visible par d'autres que si vous créez un lien de partage, que vous pouvez désactiver à tout moment.",
  },
  {
    label: 'Faut-il un compte pour lire une conversation partagée ?',
    content:
      "Non. Un lien de partage s'ouvre sans compte. Il faut seulement être connecté pour l'enregistrer dans votre bibliothèque.",
  },
  {
    label: 'Puis-je supprimer mes données ?',
    content:
      'Oui, depuis les réglages. La suppression du compte efface toutes vos conversations et vos messages.',
  },
];
</script>

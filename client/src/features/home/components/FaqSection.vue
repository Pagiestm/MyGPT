<template>
  <section id="faq" class="border-t border-default px-4 py-20">
    <div v-reveal class="mx-auto flex max-w-3xl flex-col gap-8">
      <h2 class="text-2xl font-semibold tracking-tight text-highlighted">Questions fréquentes</h2>
      <UAccordion :items="faq" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';
import UAccordion from '@nuxt/ui/components/Accordion.vue';

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

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
    content:
      "Celui que vous choisissez, parmi ceux que propose l'instance. Ils s'exécutent tous dans votre navigateur, en WebGPU : aucun service d'IA extérieur n'intervient. Chaque modèle indique ses points forts, ses limites et la mémoire graphique qu'il demande.",
  },
  {
    label: 'Faut-il payer ou fournir une clé d’API ?',
    content:
      "Non. Il n'y a ni abonnement, ni clé, ni quota : le modèle tourne sur votre machine, pas chez un fournisseur.",
  },
  {
    label: 'De quoi ai-je besoin pour que ça marche ?',
    content:
      "Un navigateur compatible WebGPU : Chrome, Edge, Safari 26 ou une version récente de Firefox. Au premier message, le modèle choisi est téléchargé une fois (de 1,6 à 5 Go selon le modèle) puis conservé dans le cache du navigateur. Sans WebGPU, l'application vous le dit au lieu de basculer vers un service en ligne.",
  },
  {
    label: 'Mes conversations sont-elles privées ?',
    content:
      "Ce que vous écrivez n'est jamais envoyé à un service d'IA : la génération a lieu dans votre onglet. Vos conversations sont enregistrées sur le serveur de cette instance, pour que vous les retrouviez et puissiez les partager. Elles ne sont visibles par d'autres que si vous créez un lien de partage, révocable à tout moment.",
  },
  {
    label: 'À quoi sert la base de connaissances ?',
    content:
      "Vous y déposez vos documents : l'assistant s'en sert pour répondre. Ils sont découpés par le serveur, puis vectorisés dans votre navigateur, là encore sans passer par un tiers. Un document peut valoir pour tout votre compte ou pour un seul dossier.",
  },
  {
    label: 'Faut-il un compte pour lire une conversation partagée ?',
    content:
      "Non. Un lien de partage s'ouvre sans compte. Il faut seulement être connecté pour l'enregistrer dans votre bibliothèque.",
  },
  {
    label: 'Puis-je supprimer mes données ?',
    content:
      'Oui, depuis les réglages. La suppression du compte efface toutes vos conversations et vos messages. Les modèles téléchargés se retirent du cache depuis les réglages également.',
  },
];
</script>

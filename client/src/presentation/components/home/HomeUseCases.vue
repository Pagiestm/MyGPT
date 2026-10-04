<template>
  <section id="use-cases" class="px-4 py-20">
    <div class="mx-auto flex max-w-5xl flex-col gap-10">
      <div v-reveal class="flex max-w-2xl flex-col gap-3">
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted">
          Un assistant pour le quotidien
        </h2>
        <p class="text-lg text-muted">
          Révisions, code, rédaction ou organisation : posez la question comme vous la poseriez à un
          collègue.
        </p>
      </div>

      <UTabs
        v-reveal="100"
        :items="cases"
        variant="link"
        color="neutral"
        :ui="{ list: 'overflow-x-auto' }"
      >
        <template #content="{ item }">
          <div
            :key="item.label"
            class="tab-panel grid gap-8 pt-6 lg:grid-cols-[1fr_1.4fr] lg:items-start"
          >
            <div class="flex flex-col gap-4">
              <p class="text-muted">{{ item.description }}</p>
              <ul class="flex flex-col gap-2 text-sm text-toned">
                <li v-for="example in item.examples" :key="example" class="flex gap-2">
                  <UIcon
                    name="i-lucide-corner-down-right"
                    class="mt-0.5 size-4 shrink-0 text-dimmed"
                  />
                  {{ example }}
                </li>
              </ul>
            </div>

            <div class="flex flex-col gap-4 rounded-2xl border border-default bg-muted p-5">
              <p
                class="self-end rounded-3xl bg-default px-4 py-2.5 text-sm text-highlighted shadow-xs"
              >
                {{ item.question }}
              </p>
              <div class="flex flex-col gap-3 text-sm leading-relaxed text-toned">
                <p v-for="line in item.answer" :key="line">{{ line }}</p>
              </div>
            </div>
          </div>
        </template>
      </UTabs>
    </div>
  </section>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import UTabs from '@nuxt/ui/components/Tabs.vue';

const cases = [
  {
    label: 'Apprendre',
    icon: 'i-lucide-graduation-cap',
    description: 'Faites-vous expliquer une notion, à votre rythme, avec des exemples concrets.',
    examples: [
      'Explique-moi la photosynthèse simplement',
      'Fais-moi réviser le TDD avec 5 questions',
      'Quelle différence entre une loi et un décret ?',
    ],
    question: 'Explique-moi le principe du TDD en trois étapes.',
    answer: [
      '1. Rouge : on écrit un test qui échoue, pour décrire le comportement attendu.',
      '2. Vert : on écrit le minimum de code pour faire passer ce test.',
      '3. Refactor : on améliore le code, les tests restant au vert.',
    ],
  },
  {
    label: 'Coder',
    icon: 'i-lucide-code-xml',
    description: 'Comprenez une erreur, faites relire une fonction, générez des tests.',
    examples: [
      'Pourquoi mon useEffect boucle-t-il à l’infini ?',
      'Écris un test Jest pour ce service',
      'Convertis ce JSON en interface TypeScript',
    ],
    question: 'Pourquoi `undefined is not a function` sur `user.getName()` ?',
    answer: [
      'L’objet `user` n’a pas de méthode `getName` au moment de l’appel.',
      'Vérifiez qu’il s’agit bien d’une instance de votre classe, et pas d’un simple objet issu d’un JSON : la désérialisation ne conserve pas les méthodes.',
    ],
  },
  {
    label: 'Écrire',
    icon: 'i-lucide-pen-line',
    description: 'Rédigez, reformulez ou traduisez un texte en gardant votre ton.',
    examples: [
      'Rends ce mail plus professionnel',
      'Traduis ce paragraphe en anglais',
      'Propose trois titres pour cet article',
    ],
    question: 'Reformule : « Je peux pas venir demain, désolé. »',
    answer: [
      'Je ne pourrai malheureusement pas être présent demain. Je vous prie de m’en excuser et reste disponible pour convenir d’un autre moment.',
    ],
  },
  {
    label: 'Organiser',
    icon: 'i-lucide-list-checks',
    description: 'Résumez un document, planifiez une semaine, découpez un projet en tâches.',
    examples: [
      'Résume ce compte rendu en 5 points',
      'Fais-moi un planning de révisions sur 2 semaines',
      'Découpe ce projet en étapes',
    ],
    question: 'Découpe la création d’un site vitrine en étapes.',
    answer: [
      '1. Définir les objectifs et les pages nécessaires.',
      '2. Rassembler les contenus : textes, photos, logo.',
      '3. Maquetter, développer, puis tester sur mobile.',
      '4. Mettre en ligne et suivre les premières visites.',
    ],
  },
];
</script>

<style scoped>
.tab-panel {
  animation: tab-in 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@keyframes tab-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-panel {
    animation: none;
  }
}
</style>

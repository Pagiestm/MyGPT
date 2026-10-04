<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-white/10 bg-stone-900/80 shadow-2xl shadow-black/40 backdrop-blur"
  >
    <div
      class="flex items-center gap-1 border-b border-white/10 p-2"
      role="tablist"
      aria-label="Exemples de conversations"
    >
      <button
        v-for="(tab, index) in examples"
        :key="tab.label"
        type="button"
        role="tab"
        :aria-selected="index === current"
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          index === current ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-stone-200'
        "
        @click="select(index)"
      >
        <UIcon :name="tab.icon" class="size-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <div class="flex min-h-80 flex-col gap-5 p-5 text-sm sm:min-h-96">
      <p
        class="max-w-[85%] self-end rounded-2xl rounded-br-md bg-cobalt-500 px-4 py-2.5 text-white"
      >
        {{ example.question }}
      </p>

      <div class="flex gap-3">
        <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-white/10">
          <UIcon name="i-lucide-sparkles" class="size-3.5 text-cobalt-300" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-3 text-stone-300">
          <p class="whitespace-pre-line">
            {{ answer }}<span v-if="!answerDone" class="caret" aria-hidden="true" />
          </p>
          <Transition name="fade">
            <pre
              v-if="answerDone && example.code"
              class="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed"
            ><code><span
              v-for="(token, i) in example.code"
              :key="i"
              :class="tokenClass[token[0]]"
            >{{ token[1] }}</span></code></pre>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import { useTypewriter } from '@/presentation/composables/useTypewriter';

type Token = ['k' | 's' | 'f' | 'c' | 't', string];

const examples: {
  label: string;
  icon: string;
  question: string;
  answer: string;
  code?: Token[];
}[] = [
  {
    label: 'Code',
    icon: 'i-lucide-code-xml',
    question: 'Comment débouncer une recherche en Vue ?',
    answer:
      'Attendez que l’utilisateur arrête de taper avant de lancer la requête. Avec VueUse, une ligne suffit :',
    code: [
      ['k', 'const '],
      ['t', 'keyword = '],
      ['f', 'ref'],
      ['t', '('],
      ['s', "''"],
      ['t', ')\n'],
      ['k', 'const '],
      ['t', 'debounced = '],
      ['f', 'refDebounced'],
      ['t', '(keyword, '],
      ['s', '300'],
      ['t', ')\n'],
      ['c', '// la requête suit `debounced`, pas `keyword`'],
    ],
  },
  {
    label: 'Résumé',
    icon: 'i-lucide-list-checks',
    question: 'Résume le principe du TDD en trois points.',
    answer:
      '1. Rouge : écrire un test qui échoue.\n2. Vert : écrire le minimum de code pour le faire passer.\n3. Refactor : améliorer le code, les tests restent verts.',
  },
  {
    label: 'Idées',
    icon: 'i-lucide-lightbulb',
    question: 'Trois noms pour une app de recettes ?',
    answer:
      'Mijoté — chaleureux et facile à retenir.\nFrigo Vide — pour cuisiner avec ce qui reste.\nPapilles — court, gourmand, disponible en .app.',
  },
];

const tokenClass = {
  k: 'text-violet-300',
  s: 'text-emerald-300',
  f: 'text-cobalt-300',
  c: 'text-stone-500',
  t: 'text-stone-200',
};

const current = ref(0);
const example = computed(() => examples[current.value]);
const { output: answer, done: answerDone } = useTypewriter(
  computed(() => example.value.answer),
  { delay: 400 },
);

let rotation: ReturnType<typeof setInterval> | undefined;

function select(index: number) {
  current.value = index;
  clearInterval(rotation);
}

onMounted(() => {
  rotation = setInterval(() => {
    if (answerDone.value) current.value = (current.value + 1) % examples.length;
  }, 7000);
});
onBeforeUnmount(() => clearInterval(rotation));
</script>

<style scoped>
.fade-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
</style>

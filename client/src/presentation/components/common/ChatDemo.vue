<template>
  <div
    ref="root"
    class="flex overflow-hidden rounded-card border border-default bg-default text-left shadow-xl shadow-black/5"
    role="img"
    :aria-label="`Démonstration de MyGPT : ${scenario.question}`"
  >
    <aside
      v-if="withSidebar"
      class="hidden w-52 shrink-0 flex-col gap-1 border-e border-default bg-muted p-3 text-sm md:flex"
      aria-hidden="true"
    >
      <AppLogo :size="20" text-class="text-sm" class="mb-3 px-2" />
      <span class="flex items-center gap-2 rounded-md px-2 py-1.5 text-toned">
        <UIcon name="i-lucide-square-pen" class="size-4" /> Nouvelle conversation
      </span>
      <span class="mt-3 px-2 text-xs text-dimmed">Aujourd'hui</span>
      <span
        v-for="(item, index) in scenarios"
        :key="item.title"
        class="truncate rounded-md px-2 py-1.5 transition-colors duration-300"
        :class="index === current ? 'bg-accented/70 font-medium text-highlighted' : 'text-muted'"
      >
        {{ item.title }}
      </span>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col" aria-hidden="true">
      <div class="border-b border-default px-5 py-3 text-sm font-medium text-highlighted">
        <Transition name="demo-fade" mode="out-in">
          <span :key="scenario.title">{{ scenario.title }}</span>
        </Transition>
      </div>

      <div
        class="flex flex-1 flex-col gap-5 overflow-hidden px-5 py-6 text-sm"
        :style="{ minHeight: height }"
      >
        <Transition name="demo-bubble">
          <p
            v-if="phase !== 'typing'"
            :key="`q-${current}`"
            class="max-w-[85%] self-end rounded-panel bg-elevated px-4 py-2.5 text-highlighted"
          >
            {{ scenario.question }}
          </p>
        </Transition>

        <UChatShimmer v-if="phase === 'thinking'" text="MyGPT réfléchit…" class="text-muted" />

        <div
          v-if="phase === 'answering' || phase === 'done'"
          class="flex flex-col gap-3 text-toned"
        >
          <template v-for="(block, b) in visibleBlocks" :key="`${current}-${b}`">
            <pre
              v-if="block.kind === 'code'"
              class="overflow-x-auto rounded-card border border-default bg-muted p-3 font-mono text-xs leading-relaxed"
            ><span v-for="(part, p) in block.parts" :key="p" :class="part.cls">{{ part.text }}</span></pre>
            <p v-else class="leading-relaxed">
              <template v-for="(part, p) in block.parts" :key="p">
                <code
                  v-if="part.cls === 'code'"
                  class="rounded bg-elevated px-1 py-0.5 font-mono text-xs text-highlighted"
                  >{{ part.text }}</code
                >
                <strong v-else-if="part.cls === 'strong'" class="text-highlighted">{{
                  part.text
                }}</strong>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
          </template>
        </div>
      </div>

      <div class="px-4 pb-4">
        <div
          class="flex items-center gap-3 rounded-field border border-default py-2.5 ps-5 pe-2.5 text-sm shadow-sm"
        >
          <span class="min-w-0 flex-1 truncate" :class="draft ? 'text-highlighted' : 'text-dimmed'">
            {{ draft || 'Écrivez votre message…' }}
          </span>
          <span
            class="grid size-7 shrink-0 place-items-center rounded-full transition-colors"
            :class="draft ? 'bg-inverted text-inverted' : 'bg-accented text-dimmed'"
          >
            <UIcon name="i-lucide-arrow-up" class="size-4" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UChatShimmer from '@nuxt/ui/components/ChatShimmer.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useElementVisibility, usePreferredReducedMotion } from '@vueuse/core';
import AppLogo from './AppLogo.vue';

withDefaults(defineProps<{ withSidebar?: boolean; height?: string }>(), {
  withSidebar: false,
  height: '18rem',
});

type Part = { text: string; cls?: string };
type Block = { kind: 'p' | 'code'; parts: Part[] };

const k = 'text-violet-600 dark:text-violet-300';
const f = 'text-sky-700 dark:text-sky-300';
const s = 'text-emerald-700 dark:text-emerald-300';
const c = 'text-dimmed';

const scenarios: { title: string; question: string; answer: Block[] }[] = [
  {
    title: 'Inverser une chaîne',
    question: 'Comment inverser une chaîne en JavaScript ?',
    answer: [
      { kind: 'p', parts: [{ text: 'Le plus simple est de passer par un tableau :' }] },
      {
        kind: 'code',
        parts: [
          { text: 'const ', cls: k },
          { text: 'inverse', cls: f },
          { text: ' = (texte) => [...texte].' },
          { text: 'reverse', cls: f },
          { text: '().' },
          { text: 'join', cls: f },
          { text: '(' },
          { text: "''", cls: s },
          { text: ');\n' },
          { text: 'inverse', cls: f },
          { text: '(' },
          { text: "'MyGPT'", cls: s },
          { text: '); ' },
          { text: "// 'TPGyM'", cls: c },
        ],
      },
      {
        kind: 'p',
        parts: [
          { text: 'Le spread ' },
          { text: '[...texte]', cls: 'code' },
          { text: ' gère aussi correctement les ' },
          { text: 'emojis', cls: 'strong' },
          { text: '.' },
        ],
      },
    ],
  },
  {
    title: 'Mail plus poli',
    question: 'Reformule plus poliment : « Envoie-moi le rapport. »',
    answer: [
      {
        kind: 'p',
        parts: [
          {
            text: 'Pourriez-vous m’envoyer le rapport lorsque vous aurez un moment ? Je vous en remercie par avance.',
          },
        ],
      },
      {
        kind: 'p',
        parts: [
          { text: 'Le ' },
          { text: 'conditionnel', cls: 'strong' },
          { text: ' et la formule de remerciement adoucissent la demande.' },
        ],
      },
    ],
  },
  {
    title: 'API REST',
    question: 'C’est quoi une API REST, en deux phrases ?',
    answer: [
      {
        kind: 'p',
        parts: [
          { text: 'Une API REST expose des ' },
          { text: 'ressources', cls: 'strong' },
          { text: ' via des URL, comme ' },
          { text: '/conversations', cls: 'code' },
          { text: '.' },
        ],
      },
      {
        kind: 'p',
        parts: [
          { text: 'On les manipule avec les verbes HTTP : ' },
          { text: 'GET', cls: 'code' },
          { text: ' pour lire, ' },
          { text: 'POST', cls: 'code' },
          { text: ' pour créer, ' },
          { text: 'DELETE', cls: 'code' },
          { text: ' pour supprimer.' },
        ],
      },
    ],
  },
];

const root = useTemplateRef<HTMLElement>('root');
const onScreen = useElementVisibility(root);
const reducedMotion = usePreferredReducedMotion();

const current = ref(0);
const phase = ref<'typing' | 'thinking' | 'answering' | 'done'>('done');
const draft = ref('');
const revealed = ref(Infinity);

const scenario = computed(() => scenarios[current.value]!);

const visibleBlocks = computed(() => {
  let budget = revealed.value;
  const blocks: Block[] = [];
  for (const block of scenario.value.answer) {
    if (budget <= 0) break;
    const parts: Part[] = [];
    for (const part of block.parts) {
      if (budget <= 0) break;
      parts.push({ ...part, text: part.text.slice(0, budget) });
      budget -= part.text.length;
    }
    blocks.push({ kind: block.kind, parts });
  }
  return blocks;
});

let stopped = false;

async function sleep(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (stopped) throw new Error('stopped');
    await new Promise((resolve) => setTimeout(resolve, Math.min(50, end - Date.now())));
    while (!onScreen.value && !stopped) await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

async function play() {
  for (;;) {
    const { question, answer } = scenario.value;
    phase.value = 'typing';
    revealed.value = 0;
    draft.value = '';
    for (let i = 1; i <= question.length; i++) {
      draft.value = question.slice(0, i);
      await sleep(28);
    }
    await sleep(350);
    draft.value = '';
    phase.value = 'thinking';
    await sleep(1100);

    phase.value = 'answering';
    const total = answer.flatMap((block) => block.parts).reduce((sum, p) => sum + p.text.length, 0);
    while (revealed.value < total) {
      revealed.value += 3;
      await sleep(16);
    }
    phase.value = 'done';
    await sleep(3500);
    current.value = (current.value + 1) % scenarios.length;
  }
}

onMounted(() => {
  if (reducedMotion.value === 'reduce') return;
  play().catch(() => {});
});

onBeforeUnmount(() => {
  stopped = true;
});
</script>

<style scoped>
.demo-bubble-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.demo-bubble-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.demo-fade-enter-active,
.demo-fade-leave-active {
  transition: opacity 0.25s ease;
}
.demo-fade-enter-from,
.demo-fade-leave-to {
  opacity: 0;
}
</style>

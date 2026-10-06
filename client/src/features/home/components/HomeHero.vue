<template>
  <section class="px-4 pt-20 pb-16 sm:pt-28">
    <div class="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
      <div class="flex flex-col gap-3">
        <h1
          class="enter text-4xl font-semibold tracking-tight text-balance text-highlighted sm:text-5xl"
        >
          Posez votre question.
        </h1>
        <p class="enter text-lg text-pretty text-muted" style="--enter-delay: 80ms">
          MyGPT vous répond avec Gemini, garde vos conversations et vous laisse les partager.
        </p>
      </div>

      <UChatPrompt
        v-model="draft"
        :placeholder="placeholder"
        :autofocus="false"
        color="neutral"
        class="enter w-full text-left"
        style="--enter-delay: 160ms"
        aria-label="Votre question"
        @submit="start"
      >
        <UChatPromptSubmit color="primary" class="rounded-full" aria-label="Envoyer la question" />
      </UChatPrompt>

      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.label"
          :icon="suggestion.icon"
          :label="suggestion.label"
          color="neutral"
          variant="outline"
          class="enter rounded-full"
          :style="{ '--enter-delay': `${240 + index * 60}ms` }"
          @click="draft = suggestion.prompt"
        />
      </div>

      <p class="enter flex items-center gap-2 text-sm text-dimmed" style="--enter-delay: 520ms">
        <UIcon name="i-lucide-shield-check" class="size-4" />
        Gratuit · Vos conversations restent privées
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UChatPrompt from '@nuxt/ui/components/ChatPrompt.vue';
import UChatPromptSubmit from '@nuxt/ui/components/ChatPromptSubmit.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useIntervalFn } from '@vueuse/core';
import { useAuthStore } from '@/features/auth';
import { useDraftPrompt } from '@/shared/composables/useDraftPrompt';
import { suggestions } from '@/shared/lib/suggestions';

const auth = useAuthStore();
const router = useRouter();
const { draft } = useDraftPrompt();

const examples = [
  'Explique-moi les closures en JavaScript',
  'Résume cet article en 5 points',
  'Propose un plan pour mon exposé',
  'Corrige cette requête SQL',
];
const exampleIndex = ref(0);
const placeholder = computed(() => `Demandez à MyGPT… « ${examples[exampleIndex.value]} »`);
const rotation = useIntervalFn(
  () => (exampleIndex.value = (exampleIndex.value + 1) % examples.length),
  3500,
);
watch(draft, (value) => (value ? rotation.pause() : rotation.resume()));

function start() {
  if (!draft.value.trim()) return;
  router.push(
    auth.isAuthenticated ? { name: 'new-chat' } : { name: 'login', query: { redirect: '/chat' } },
  );
}
</script>

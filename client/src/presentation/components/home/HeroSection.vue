<template>
  <section class="hero relative isolate overflow-hidden bg-stone-950 text-white">
    <div class="grid-bg absolute inset-0 -z-10" aria-hidden="true" />
    <div class="glow absolute -z-10" aria-hidden="true" />

    <UContainer class="grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
      <div class="flex flex-col gap-8">
        <p
          class="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-stone-300"
        >
          <span class="size-1.5 rounded-full bg-emerald-400" />
          Propulsé par Gemini de Google
        </p>

        <h1
          class="text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          Posez la question.<br />
          <span class="text-stone-400">Obtenez </span>
          <span class="text-white">{{ typed }}</span
          ><span class="caret" aria-hidden="true" />
        </h1>

        <p class="max-w-xl text-lg text-pretty text-stone-400">
          MyGPT répond à vos questions, écrit et explique du code, résume vos textes. Chaque
          conversation est gardée, consultable et partageable en un lien.
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <UButton
            :to="auth.isAuthenticated ? { name: 'new-chat' } : { name: 'register' }"
            size="xl"
            trailing-icon="i-lucide-arrow-right"
          >
            {{ auth.isAuthenticated ? 'Ouvrir le chat' : 'Commencer gratuitement' }}
          </UButton>
          <UButton
            v-if="!auth.isAuthenticated"
            :to="{ name: 'login' }"
            size="xl"
            color="neutral"
            variant="ghost"
            class="text-stone-300 hover:bg-white/10 hover:text-white"
          >
            J'ai déjà un compte
          </UButton>
        </div>
      </div>

      <LiveDemo />
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import { useAuthStore } from '@/application/stores/auth.store';
import { useTypewriter } from '@/presentation/composables/useTypewriter';
import LiveDemo from './LiveDemo.vue';

const auth = useAuthStore();

const endings = [
  'une vraie réponse.',
  'du code expliqué.',
  'un résumé clair.',
  'des idées neuves.',
];
const index = ref(0);
const { output: typed } = useTypewriter(
  computed(() => endings[index.value]),
  { speed: 45 },
);

let rotation: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  rotation = setInterval(() => (index.value = (index.value + 1) % endings.length), 3200);
});
onBeforeUnmount(() => clearInterval(rotation));
</script>

<style scoped>
.grid-bg {
  background-image: radial-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%);
}

.glow {
  top: -20%;
  right: -10%;
  width: 55rem;
  height: 40rem;
  background: radial-gradient(closest-side, rgb(46 91 255 / 0.35), transparent);
  filter: blur(20px);
}
</style>

<template>
  <section class="px-4 pb-24">
    <div
      class="cta relative isolate mx-auto flex max-w-5xl flex-col items-center gap-8 overflow-hidden rounded-3xl bg-stone-950 px-6 py-16 text-center text-white sm:py-20"
    >
      <h2 class="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Votre première question est à un clic<span class="caret" aria-hidden="true" />
      </h2>
      <p class="max-w-lg text-stone-400">
        Créez un compte en moins d'une minute. C'est gratuit, et vous pouvez tout supprimer à tout
        moment.
      </p>
      <RouterLink
        :to="auth.isAuthenticated ? { name: 'new-chat' } : { name: 'register' }"
        class="group flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-2 pl-5 text-left text-stone-400 transition-colors hover:border-cobalt-400/60 hover:bg-white/10"
      >
        <span class="flex-1 truncate">Demandez-moi n'importe quoi…</span>
        <span
          class="grid size-10 place-items-center rounded-xl bg-cobalt-500 text-white transition-transform group-hover:-translate-y-0.5"
        >
          <UIcon name="i-lucide-arrow-up" class="size-5" />
        </span>
        <span class="sr-only">
          {{ auth.isAuthenticated ? 'Ouvrir le chat' : 'Créer un compte' }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import { useAuthStore } from '@/application/stores/auth.store';

const auth = useAuthStore();
</script>

<style scoped>
.cta::before {
  content: '';
  position: absolute;
  inset: auto -20% -60% -20%;
  height: 80%;
  z-index: -1;
  background: radial-gradient(closest-side, rgb(46 91 255 / 0.45), transparent);
}
</style>

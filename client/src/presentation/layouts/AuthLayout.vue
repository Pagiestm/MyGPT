<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <div class="flex flex-col">
      <header class="flex h-16 items-center px-6">
        <RouterLink :to="{ name: 'home' }" aria-label="Retour à l'accueil">
          <AppLogo />
        </RouterLink>
      </header>

      <main class="flex flex-1 items-center justify-center px-4 py-12">
        <div class="enter w-full max-w-sm">
          <slot />
        </div>
      </main>

      <footer class="px-6 py-5 text-xs text-dimmed">
        © {{ year }} MyGPT ·
        <RouterLink :to="{ name: 'home', hash: '#privacy' }" class="hover:text-highlighted">
          Confidentialité
        </RouterLink>
      </footer>
    </div>

    <aside
      class="relative hidden flex-col justify-center gap-10 overflow-hidden bg-muted px-12 py-16 lg:flex"
      aria-label="Présentation de MyGPT"
    >
      <div class="pointer-events-none absolute inset-0 dotted" aria-hidden="true" />

      <div class="relative flex max-w-lg flex-col gap-6">
        <h2
          class="enter text-3xl font-semibold tracking-tight text-balance text-highlighted"
          style="--enter-delay: 100ms"
        >
          Posez votre question, MyGPT s'occupe du reste.
        </h2>
        <ul class="flex flex-col gap-3 text-toned">
          <li
            v-for="(point, index) in points"
            :key="point.label"
            class="enter flex items-center gap-3"
            :style="{ '--enter-delay': `${200 + index * 90}ms` }"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-tile border border-default bg-default"
            >
              <UIcon :name="point.icon" class="size-4 text-highlighted" />
            </span>
            {{ point.label }}
          </li>
        </ul>
      </div>

      <div class="enter relative max-w-lg" style="--enter-delay: 450ms">
        <ChatDemo height="15rem" />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import AppLogo from '@/presentation/components/common/AppLogo.vue';
import ChatDemo from '@/presentation/components/common/ChatDemo.vue';

const year = new Date().getFullYear();

const points = [
  { icon: 'i-lucide-message-square-text', label: 'Des réponses claires, code coloré compris' },
  { icon: 'i-lucide-history', label: 'Un historique gardé et consultable' },
  { icon: 'i-lucide-link', label: 'Des conversations partageables en un lien' },
];
</script>

<style scoped>
.dotted {
  background-image: radial-gradient(var(--ui-border-accented) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: linear-gradient(to bottom, black, transparent 70%);
  opacity: 0.6;
}
</style>

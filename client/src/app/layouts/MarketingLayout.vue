<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-10 bg-default/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div class="flex items-center gap-8">
          <RouterLink :to="{ name: 'home' }" aria-label="MyGPT, accueil">
            <AppLogo />
          </RouterLink>
          <nav class="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Sections">
            <RouterLink
              v-for="link in sections"
              :key="link.hash"
              :to="{ name: 'home', hash: link.hash }"
              class="transition-colors hover:text-highlighted"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
        </div>

        <nav class="flex items-center gap-2" aria-label="Compte">
          <UColorModeButton />
          <UButton
            v-if="auth.isAuthenticated"
            :to="{ name: 'new-chat' }"
            class="rounded-full"
            label="Ouvrir le chat"
          />
          <template v-else>
            <UButton
              :to="{ name: 'login' }"
              color="neutral"
              variant="outline"
              class="rounded-full"
              label="Se connecter"
            />
            <UButton
              :to="{ name: 'register' }"
              class="hidden rounded-full sm:inline-flex"
              label="Inscription gratuite"
            />
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default bg-muted">
      <div
        class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
      >
        <div class="flex flex-col gap-3">
          <AppLogo />
          <p class="max-w-xs text-sm text-muted">
            Assistant conversationnel propulsé par Gemini. Le code source est disponible sur GitHub.
          </p>
        </div>

        <div v-for="column in columns" :key="column.title" class="flex flex-col gap-3">
          <h2 class="text-sm font-semibold text-highlighted">{{ column.title }}</h2>
          <ul class="flex flex-col gap-2 text-sm text-muted">
            <li v-for="link in column.links" :key="link.label">
              <ULink
                :to="link.to"
                :target="link.external ? '_blank' : undefined"
                class="hover:text-highlighted"
              >
                {{ link.label }}
              </ULink>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-default">
        <p class="mx-auto max-w-6xl px-4 py-5 text-xs text-dimmed">
          © {{ year }} MyGPT · Développé par Théotime · Licence CC BY-NC-SA 4.0
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UColorModeButton from '@nuxt/ui/components/color-mode/ColorModeButton.vue';
import ULink from '@nuxt/ui/components/Link.vue';
import type { RouteLocationRaw } from 'vue-router';
import { useAuthStore } from '@/features/auth';
import AppLogo from '@/shared/ui/AppLogo.vue';

const auth = useAuthStore();
const year = new Date().getFullYear();

const sections = [
  { label: "Cas d'usage", hash: '#use-cases' },
  { label: 'Fonctionnalités', hash: '#features' },
  { label: 'Confidentialité', hash: '#privacy' },
  { label: 'FAQ', hash: '#faq' },
];

const columns: {
  title: string;
  links: { label: string; to: RouteLocationRaw | string; external?: boolean }[];
}[] = [
  {
    title: 'Produit',
    links: [
      { label: "Cas d'usage", to: { name: 'home', hash: '#use-cases' } },
      { label: 'Fonctionnalités', to: { name: 'home', hash: '#features' } },
      { label: 'Confidentialité', to: { name: 'home', hash: '#privacy' } },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'FAQ', to: { name: 'home', hash: '#faq' } },
      {
        label: 'Documentation de l’API',
        to: `${import.meta.env.VITE_API_URL}/api`,
        external: true,
      },
      { label: 'Code source', to: 'https://github.com/Pagiestm/MyGPT', external: true },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Se connecter', to: { name: 'login' } },
      { label: 'Créer un compte', to: { name: 'register' } },
    ],
  },
];
</script>

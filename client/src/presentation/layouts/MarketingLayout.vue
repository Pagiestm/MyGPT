<template>
  <UHeader :links-collapse="false">
    <template #title>
      <AppLogo />
    </template>

    <UNavigationMenu :items="links" variant="link" color="neutral" />

    <template #right>
      <UColorModeButton />
      <template v-if="auth.isAuthenticated">
        <UButton to="/chat" trailing-icon="i-lucide-arrow-right">Ouvrir le chat</UButton>
      </template>
      <template v-else>
        <UButton to="/login" color="neutral" variant="ghost" class="hidden sm:inline-flex">
          Se connecter
        </UButton>
        <UButton to="/register">Créer un compte</UButton>
      </template>
    </template>

    <template #body>
      <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>

  <UMain>
    <slot />
  </UMain>

  <UFooter>
    <template #left>
      <p class="text-sm text-muted">© {{ year }} MyGPT · Développé par Théotime</p>
    </template>
    <template #right>
      <UButton
        to="https://github.com/Pagiestm/MyGPT"
        target="_blank"
        icon="i-lucide-github"
        color="neutral"
        variant="ghost"
        aria-label="Code source sur GitHub"
      />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UColorModeButton from '@nuxt/ui/components/color-mode/ColorModeButton.vue';
import UFooter from '@nuxt/ui/components/Footer.vue';
import UHeader from '@nuxt/ui/components/Header.vue';
import UMain from '@nuxt/ui/components/Main.vue';
import UNavigationMenu from '@nuxt/ui/components/NavigationMenu.vue';
import type { NavigationMenuItem } from '@nuxt/ui';
import AppLogo from '@/presentation/components/common/AppLogo.vue';
import { useAuthStore } from '@/application/stores/auth.store';

const auth = useAuthStore();
const year = new Date().getFullYear();

const links: NavigationMenuItem[] = [
  { label: 'Fonctionnalités', to: '/#features' },
  { label: 'Comment ça marche', to: '/#how' },
  { label: 'FAQ', to: '/#faq' },
];
</script>

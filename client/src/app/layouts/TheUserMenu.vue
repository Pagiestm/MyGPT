<template>
  <UDropdownMenu :items="items" :content="{ align: 'start', side: 'top' }" class="w-full">
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="justify-start"
      :avatar="{ text: initials, size: 'xs' }"
      :label="auth.user?.pseudo"
      trailing-icon="i-lucide-chevrons-up-down"
      :ui="{ trailingIcon: 'ms-auto text-dimmed' }"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useColorMode } from '@vueuse/core';
import type { DropdownMenuItem } from '@nuxt/ui';
import { useAuthStore } from '@/features/auth';
import { isAdmin } from '@/shared/types/user';
import { version } from '@/shared/lib/version';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { store: colorMode } = useColorMode();

const initials = computed(() => auth.user?.pseudo.slice(0, 2).toUpperCase() ?? '');

const items = computed<DropdownMenuItem[][]>(() => [
  [
    { label: auth.user?.email ?? '', type: 'label' },
    { label: `MyGPT v${version}`, type: 'label', class: 'py-0 text-xs text-dimmed' },
  ],
  [
    { label: 'Réglages', icon: 'i-lucide-settings', to: '/settings' },
    { label: 'Bibliothèque', icon: 'i-lucide-library', to: '/library' },
    { label: 'Corbeille', icon: 'i-lucide-trash-2', to: '/corbeille' },
    ...(isAdmin(auth.user)
      ? [{ label: 'Administration', icon: 'i-lucide-shield', to: '/admin' }]
      : []),
  ],
  [
    {
      label: 'Thème',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Clair',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect: () => (colorMode.value = 'light'),
        },
        {
          label: 'Sombre',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onSelect: () => (colorMode.value = 'dark'),
        },
        {
          label: 'Système',
          icon: 'i-lucide-monitor',
          type: 'checkbox',
          checked: colorMode.value === 'auto',
          onSelect: () => (colorMode.value = 'auto'),
        },
      ],
    },
  ],
  [{ label: 'Se déconnecter', icon: 'i-lucide-log-out', onSelect: logout }],
]);

async function logout() {
  await auth.logout();
  toast.add({ title: 'Déconnexion réussie', color: 'success' });
  await router.push('/login');
}
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-model:open="menuOpen"
      collapsible
      resizable
      :default-size="17"
      :min-size="14"
      :max-size="24"
      class="bg-muted"
      :ui="{ footer: 'border-none' }"
    >
      <template #header="{ collapsed }">
        <RouterLink :to="{ name: 'new-chat' }" aria-label="MyGPT, nouvelle conversation">
          <AppLogo :icon-only="collapsed" />
        </RouterLink>
      </template>

      <template #default="{ collapsed }">
        <ChatSidebar v-if="!collapsed" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu v-if="!collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <CommandPalette />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import UDashboardGroup from '@nuxt/ui/components/DashboardGroup.vue';
import UDashboardSidebar from '@nuxt/ui/components/DashboardSidebar.vue';
import AppLogo from '@/presentation/components/common/AppLogo.vue';
import UserMenu from '@/presentation/components/common/UserMenu.vue';
import ChatSidebar from '@/presentation/components/chat/ChatSidebar.vue';
import CommandPalette from '@/presentation/components/chat/CommandPalette.vue';
import { ref } from 'vue';
import { useEventListener } from '@vueuse/core';

// Sur mobile, le menu se referme à chaque lien suivi, même vers la page déjà affichée
// (Nuxt UI ne le ferme que sur un changement de route)
const menuOpen = ref(false);

useEventListener(
  document,
  'click',
  (event) => {
    if (menuOpen.value && (event.target as Element | null)?.closest('a[href]')) {
      menuOpen.value = false;
    }
  },
  { capture: true },
);
</script>

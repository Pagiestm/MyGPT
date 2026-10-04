<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      collapsible
      resizable
      :default-size="17"
      :min-size="14"
      :max-size="24"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <RouterLink to="/chat" aria-label="MyGPT, nouvelle conversation">
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
  </UDashboardGroup>
</template>

<script setup lang="ts">
import UDashboardGroup from '@nuxt/ui/components/DashboardGroup.vue';
import UDashboardSidebar from '@nuxt/ui/components/DashboardSidebar.vue';
import AppLogo from '@/presentation/components/common/AppLogo.vue';
import UserMenu from '@/presentation/components/common/UserMenu.vue';
import ChatSidebar from '@/presentation/components/chat/ChatSidebar.vue';
</script>

<template>
  <UApp :toaster="{ position: 'bottom-right' }">
    <component :is="layout">
      <RouterView />
    </component>
  </UApp>
</template>

<script setup lang="ts">
import UApp from '@nuxt/ui/components/App.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './presentation/layouts/AppLayout.vue';
import AuthLayout from './presentation/layouts/AuthLayout.vue';
import MarketingLayout from './presentation/layouts/MarketingLayout.vue';

const route = useRoute();

const layouts = { app: AppLayout, auth: AuthLayout, marketing: MarketingLayout };
const layout = computed(() => layouts[route.meta.layout ?? 'marketing']);
</script>

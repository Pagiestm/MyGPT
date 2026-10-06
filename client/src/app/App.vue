<template>
  <UApp :locale="fr" :toaster="{ position: 'bottom-right' }">
    <component :is="layout">
      <RouterView />
    </component>
  </UApp>
</template>

<script setup lang="ts">
import { fr } from '@nuxt/ui/locale';
import UApp from '@nuxt/ui/components/App.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './layouts/AppLayout.vue';
import AuthLayout from './layouts/AuthLayout.vue';
import MarketingLayout from './layouts/MarketingLayout.vue';

const route = useRoute();

const layouts = { app: AppLayout, auth: AuthLayout, marketing: MarketingLayout };
const layout = computed(() => layouts[route.meta.layout ?? 'marketing']);
</script>

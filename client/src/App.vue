<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import DefaultLayout from './components/layout/DefaultLayout.vue';
import ChatLayout from './components/chat/ChatLayout.vue';

const route = useRoute();

const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'default';

  if (layout === 'chat') {
    return ChatLayout;
  }

  return DefaultLayout;
});
</script>

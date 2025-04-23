<template>
    <component :is="layoutComponent">
        <router-view />
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// Importation des layouts
import DefaultLayout from './components/layout/DefaultLayout.vue';
import ChatLayout from './components/chat/ChatLayout.vue';

const route = useRoute();

// Déterminer le layout à utiliser en fonction de la route
const layoutComponent = computed(() => {
    const layout = route.meta.layout || 'default';

    // Retourner le composant de layout approprié
    if (layout === 'chat') {
        return ChatLayout;
    }

    return DefaultLayout;
});
</script>

<template>
    <div class="text-center py-8">
        <div class="text-gray-400 mb-3">
            <i class="fas fa-comments text-3xl"></i>
        </div>
        <p v-if="searchMode" class="text-gray-500 text-sm">
            Aucun résultat trouvé
        </p>
        <p v-else class="text-gray-500 text-sm">Aucune conversation</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    searchMode: boolean;
}>();
</script>

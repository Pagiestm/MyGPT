<template>
    <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {{ title }}
        </h2>
        <p v-if="subtitle" class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ subtitle }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    subtitle?: string;
}>();
</script>

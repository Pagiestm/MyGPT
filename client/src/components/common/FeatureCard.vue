<template>
    <div
        class="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
        <div
            class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="icon"
                />
            </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-3">
            {{ title }}
        </h3>
        <p class="text-gray-600 text-center">{{ description }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    icon: string;
    title: string;
    description: string;
}>();
</script>

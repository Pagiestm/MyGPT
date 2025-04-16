<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-indigo-900/40 transition-all duration-300"
        role="dialog"
        aria-live="polite"
    >
        <!-- Spinner stylisé -->
        <div class="relative">
            <!-- Cercle externe -->
            <div
                class="w-20 h-20 border-4 border-blue-100/30 border-t-blue-500 rounded-full animate-spin"
            ></div>

            <!-- Cercle interne -->
            <div
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-4 border-indigo-200/30 border-t-indigo-600 rounded-full animate-spin animation-delay-150"
            ></div>

            <!-- Logo simplifié au centre -->
            <div
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-white"
            >
                <span class="text-blue-400">M</span
                ><span class="text-indigo-300">G</span>
            </div>
        </div>

        <!-- Message avec box -->
        <div
            v-if="message"
            class="mt-8 px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg shadow-lg"
        >
            <p class="text-white font-medium text-lg tracking-wide">
                {{ message }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    show: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        default: 'Chargement en cours...'
    }
});
</script>

<style scoped>
.animation-delay-150 {
    animation-delay: -0.15s;
}
</style>

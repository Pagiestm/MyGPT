<template>
    <button
        type="submit"
        :disabled="loading"
        class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        :class="{ 'opacity-80 cursor-not-allowed': loading }"
    >
        <svg
            v-if="loading"
            class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            ></circle>
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        {{ loading ? loadingText : text }}
    </button>
</template>

<script setup lang="ts">
defineProps({
    loading: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        required: true
    },
    loadingText: {
        type: String,
        required: true
    }
});
</script>

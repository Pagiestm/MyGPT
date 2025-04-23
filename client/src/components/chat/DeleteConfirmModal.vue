<template>
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div
                class="fixed inset-0 bg-black opacity-40"
                @click="$emit('cancel')"
            ></div>
            <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-1">{{ title }}</h3>
                    <p class="text-gray-600 mb-6">
                        {{ message }}
                    </p>
                    <div class="flex justify-end gap-3">
                        <button
                            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            @click="$emit('cancel')"
                        >
                            Annuler
                        </button>
                        <button
                            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            @click="$emit('confirm')"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    message: string;
}>();

defineEmits<{
    (e: 'confirm'): void;
    (e: 'cancel'): void;
}>();
</script>

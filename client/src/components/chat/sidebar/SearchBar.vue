<template>
    <div class="mb-5">
        <div class="relative">
            <input
                :value="modelValue"
                type="text"
                placeholder="Rechercher..."
                class="w-full p-2.5 rounded-lg border border-gray-300 pl-9 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-30 transition-all"
                @input="
                    $emit(
                        'update:modelValue',
                        ($event.target as HTMLInputElement).value
                    );
                    $emit('input');
                "
            />
            <span class="absolute left-3 top-3 text-gray-400">
                <i class="fas fa-search"></i>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
}>();

defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'input'): void;
}>();
</script>

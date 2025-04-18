<template>
    <div
        class="rounded-2xl p-4 bg-white border border-gray-200 shadow-md transition-all duration-300 w-full"
    >
        <textarea
            ref="textareaRef"
            v-model="localContent"
            class="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 outline-none mb-4 resize-none bg-white text-gray-700 transition-all duration-300"
            :rows="Math.max(3, (localContent.match(/\n/g) || []).length + 1)"
            placeholder="Modifiez votre message..."
            @keydown.enter.exact.prevent="$emit('save')"
            @keydown.escape="$emit('cancel')"
        >
        </textarea>

        <div class="flex justify-end gap-3">
            <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center gap-2 font-medium"
                @click="$emit('cancel')"
            >
                <i class="fas fa-times text-sm"></i>
                <span>Annuler</span>
            </button>

            <button
                type="button"
                class="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                :disabled="isSaving || !localContent.trim()"
                @click="$emit('save')"
            >
                <i class="fas fa-check text-sm"></i>
                <span>Modifier</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

const props = defineProps<{
    modelValue: string;
    isSaving?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'save'): void;
    (e: 'cancel'): void;
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const localContent = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

onMounted(() => {
    // Focus sur le textarea et placer le curseur à la fin du texte
    if (textareaRef.value) {
        textareaRef.value.focus();
        const length = props.modelValue.length;
        textareaRef.value.setSelectionRange(length, length);
    }
});
</script>

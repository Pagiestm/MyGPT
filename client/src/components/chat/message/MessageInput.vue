<template>
    <footer class="border-t border-gray-200 p-4 bg-white shadow-sm">
        <div
            class="flex rounded-lg shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-400 bg-white overflow-hidden"
        >
            <textarea
                ref="textareaRef"
                v-model="message"
                class="flex-1 p-4 resize-none focus:outline-none min-h-[50px] text-gray-700 placeholder-gray-400"
                :rows="
                    Math.min(
                        5,
                        Math.max(1, (message.match(/\n/g) || []).length + 1)
                    )
                "
                placeholder="Écrivez votre message..."
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.ctrl.enter="insertNewLine"
            ></textarea>

            <div class="flex items-end">
                <button
                    class="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-6 transition-all duration-200 h-full flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-indigo-400"
                    :disabled="!message.trim() || isSending"
                    title="Envoyer le message"
                    @click="sendMessage"
                >
                    <i
                        class="fas"
                        :class="
                            isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'
                        "
                    ></i>
                </button>
            </div>
        </div>

        <div class="text-xs text-gray-500 mt-2 text-right">
            <span
                >Appuyez sur
                <kbd
                    class="font-sans border border-gray-300 bg-gray-100 px-1 rounded"
                    >Entrée</kbd
                >
                pour envoyer,
                <kbd
                    class="font-sans border border-gray-300 bg-gray-100 px-1 rounded"
                    >Ctrl+Entrée</kbd
                >
                pour un saut de ligne</span
            >
        </div>
    </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps<{
    isSending: boolean;
}>();

const emit = defineEmits<{
    (e: 'send', content: string): void;
}>();

const message = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function sendMessage() {
    if (!message.value.trim() || props.isSending) return;

    const content = message.value.trim();
    emit('send', content);
    message.value = '';

    // Réinitialiser la hauteur du textarea après envoi
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto';
        }
    });
}

function insertNewLine() {
    message.value += '\n';
}

onMounted(() => {
    // Focus automatique sur le textarea au chargement
    if (textareaRef.value) {
        textareaRef.value.focus();
    }
});
</script>

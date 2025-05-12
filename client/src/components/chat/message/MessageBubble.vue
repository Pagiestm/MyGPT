<template>
    <div class="animate-fade-in-up p-2">
        <MessageHeader :message="message" :is-regenerating="isRegenerating" />

        <div
            class="w-full flex"
            :class="message.isFromAi ? 'justify-start' : 'justify-end'"
        >
            <div
                :class="[
                    'inline-block max-w-[85%]',
                    message.isFromAi ? 'ml-0 mr-auto' : 'mr-0 ml-auto'
                ]"
            >
                <!-- Mode édition -->
                <MessageEditor
                    v-if="isEditing && !message.isFromAi"
                    ref="editTextarea"
                    v-model="editedContent"
                    :is-saving="isSaving"
                    @save="saveEdit"
                    @cancel="cancelEdit"
                />

                <!-- Mode affichage normal -->
                <div v-else :class="bubbleClasses">
                    <LoadingDots v-if="isRegenerating && message.isFromAi" />

                    <MessageContent
                        v-else
                        :content="message.content"
                        :is-from-ai="message.isFromAi"
                        @copy-code="copyCode"
                    />
                </div>

                <!-- Actions sur le message (visibles au survol) -->
                <div
                    v-if="!message.isFromAi && !isEditing"
                    class="flex justify-end mt-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity"
                >
                    <button
                        class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full shadow transition-all duration-200"
                        title="Modifier ce message"
                        @click="startEditing"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import { Message } from '../../../interfaces/message.interface';
import MessageHeader from './MessageHeader.vue';
import MessageContent from './MessageContent.vue';
import MessageEditor from './MessageEditor.vue';
import LoadingDots from './LoadingDots.vue';

const props = defineProps<{
    message: Message;
    isSaving?: boolean;
    isRegenerating?: boolean;
}>();

const emit = defineEmits<{
    (e: 'edit', message: Message, content: string, regenerateAi: boolean): void;
}>();

// États
const isEditing = ref(false);
const editedContent = ref('');
const editTextarea = ref<InstanceType<typeof MessageEditor> | null>(null);

// Classes calculées pour la bulle de message
const bubbleClasses = computed(() => [
    'rounded-2xl shadow-sm overflow-hidden',
    props.message.isFromAi ? 'bg-white border border-gray-200' : 'bg-primary',
    props.isRegenerating && props.message.isFromAi ? 'p-2' : 'p-5'
]);

// Fonctions
function startEditing() {
    editedContent.value = props.message.content;
    isEditing.value = true;

    nextTick(() => {
        const textarea = editTextarea.value?.$el?.querySelector('textarea');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(
                editedContent.value.length,
                editedContent.value.length
            );
        }
    });
}

function cancelEdit() {
    isEditing.value = false;
    editedContent.value = '';
}

function saveEdit() {
    if (!editedContent.value.trim()) return;
    // Animation de sauvegarde
    isEditing.value = false;
    emit('edit', props.message, editedContent.value.trim(), true);
}

function copyCode(code: string) {
    navigator.clipboard.writeText(code);
}

// Réinitialiser l'état d'édition quand le message est sauvegardé
watch(
    () => props.isSaving,
    (newValue) => {
        if (newValue === false && isEditing.value) {
            isEditing.value = false;
        }
    }
);
</script>

<template>
    <div
        :class="[
            'flex items-center mb-2',
            message.isFromAi ? 'justify-start' : 'justify-end'
        ]"
    >
        <!-- Avatar (masqué pendant la régénération) -->
        <div
            v-if="!isRegeneratingAI"
            :class="[
                'rounded-full h-6 w-6 flex items-center justify-center',
                'bg-indigo-500 text-white'
            ]"
        >
            <i
                :class="[
                    message.isFromAi ? 'fas fa-robot' : 'fas fa-user',
                    'text-[12px]'
                ]"
            ></i>
        </div>

        <!-- Nom de l'émetteur (masqué pendant la régénération) -->
        <span
            v-if="!isRegeneratingAI"
            class="text-xs font-medium mx-2 text-indigo-600"
        >
            {{ message.isFromAi ? 'IA' : 'Vous' }}
        </span>

        <!-- Date et heure (masqués pendant la régénération) -->
        <div
            v-if="!isRegeneratingAI"
            class="text-xs text-gray-400 flex items-center"
        >
            <span>{{ formattedTime }}</span>
            <span class="mx-1">•</span>
            <span>{{ formattedDate }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Message } from '../../../interfaces/message.interface';

// Props
const props = defineProps<{
    message: Message;
    isRegenerating?: boolean;
}>();

// Raccourci pour vérifier si c'est en cours de régénération de message IA
const isRegeneratingAI = computed(
    () => props.isRegenerating && props.message.isFromAi
);

// Formater la date pour affichage
const formattedDate = computed(() => {
    const date = new Date(props.message.createdAt);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });
});

// Formater l'heure pour affichage
const formattedTime = computed(() => {
    const date = new Date(props.message.createdAt);
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
});
</script>

<template>
  <div :class="['flex items-center mb-2', message.isFromAi ? 'justify-start' : 'justify-end']">
    <div
      v-if="!isRegeneratingAI"
      :class="['rounded-full h-6 w-6 flex items-center justify-center', 'bg-indigo-500 text-white']"
    >
      <i :class="[message.isFromAi ? 'fas fa-robot' : 'fas fa-user', 'text-[12px]']"></i>
    </div>

    <span v-if="!isRegeneratingAI" class="text-xs font-medium mx-2 text-indigo-600">
      {{ message.isFromAi ? 'IA' : userPseudo }}
    </span>

    <div v-if="!isRegeneratingAI" class="text-xs text-gray-400 flex items-center">
      <span>{{ formattedTime }}</span>
      <span class="mx-1">•</span>
      <span>{{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Message } from '../../../interfaces/message.interface';
import Database from '../../../utils/database.utils';

const props = defineProps<{
  message: Message;
  isRegenerating?: boolean;
}>();

const userPseudo = ref('Vous');

const isRegeneratingAI = computed(() => props.isRegenerating && props.message.isFromAi);

const formattedDate = computed(() => {
  const date = new Date(props.message.createdAt);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
});

const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

async function getUserPseudo() {
  try {
    const userProfile = await Database.getAll('auth/profile');
    if (userProfile && userProfile.pseudo) {
      userPseudo.value = userProfile.pseudo;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du pseudo de l'utilisateur:", error);
    // En cas d'erreur, on garde la valeur par défaut "Vous"
  }
}

onMounted(() => {
  if (!props.message.isFromAi) {
    getUserPseudo();
  }
});
</script>

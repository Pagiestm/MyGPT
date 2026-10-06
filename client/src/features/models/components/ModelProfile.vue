<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-default">{{ model.description }}</p>

    <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <div v-if="model.parameters" class="flex gap-1">
        <dt>Taille</dt>
        <dd class="text-default">{{ model.parameters }} de paramètres</dd>
      </div>
      <div class="flex gap-1">
        <dt>Mémoire graphique</dt>
        <dd class="text-default">{{ formatVram(model.vramMb) }}</dd>
      </div>
      <div v-if="model.contextWindow" class="flex gap-1">
        <dt>Contexte</dt>
        <dd class="text-default">{{ formatContextWindow(model.contextWindow) }}</dd>
      </div>
    </dl>

    <div v-if="model.strengths.length" class="flex flex-col gap-1">
      <p class="text-xs font-medium text-highlighted">Points forts</p>
      <ul class="flex flex-wrap gap-1">
        <li v-for="strength in model.strengths" :key="strength">
          <UBadge color="success" variant="subtle" size="sm">{{ strength }}</UBadge>
        </li>
      </ul>
    </div>

    <div v-if="model.limitations.length" class="flex flex-col gap-1">
      <p class="text-xs font-medium text-highlighted">Limites</p>
      <ul class="flex flex-wrap gap-1">
        <li v-for="limitation in model.limitations" :key="limitation">
          <UBadge color="warning" variant="subtle" size="sm">{{ limitation }}</UBadge>
        </li>
      </ul>
    </div>

    <p v-if="requirements.length" class="text-xs text-muted">
      Prérequis : {{ requirements.join(' · ') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue';
import { computed } from 'vue';
import type { AiModel } from '../types/ai';
import { featureLabel, formatContextWindow, formatVram } from '../types/webgpu';

const props = defineProps<{ model: AiModel }>();

const requirements = computed(() => [
  ...(props.model.lowResource ? [] : ['GPU dédié conseillé']),
  ...props.model.requiredFeatures.map(featureLabel),
]);
</script>

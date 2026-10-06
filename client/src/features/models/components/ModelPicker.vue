<template>
  <USelectMenu
    v-if="supported && items.length"
    v-model="selected"
    :items="items"
    value-key="value"
    :search-input="false"
    color="neutral"
    variant="ghost"
    size="sm"
    :content="{ align: 'start', side: 'top' }"
    :ui="{ content: 'min-w-80' }"
    aria-label="Modèle d'IA"
    class="w-auto"
  />
  <UTooltip v-else text="Essayez Chrome, Edge, Safari 26+ ou Firefox récent">
    <span class="px-2 text-xs text-muted">Navigateur sans WebGPU</span>
  </UTooltip>
</template>

<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/features/auth';
import { useModels } from '../composables/useModels';

const model = defineModel<string | undefined>();

const auth = useAuthStore();
const { data, supported } = useModels();

const items = computed(() =>
  (data.value?.models ?? []).map((item) => ({
    value: item.id,
    label: item.label,
    description: item.description,
  })),
);

const selected = computed({
  get: () => model.value ?? auth.user?.preferredModel ?? data.value?.defaultModel,
  set: (value) => (model.value = value),
});
</script>

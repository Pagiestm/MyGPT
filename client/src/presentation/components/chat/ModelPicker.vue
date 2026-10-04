<template>
  <USelectMenu
    v-if="data"
    v-model="selected"
    :items="items"
    value-key="value"
    :search-input="false"
    color="neutral"
    variant="ghost"
    size="sm"
    :content="{ align: 'start', side: 'top' }"
    :ui="{ content: 'min-w-64' }"
    aria-label="Modèle d'IA"
    class="w-auto"
  >
    <template #item-label="{ item }">
      <span class="flex flex-col">
        <span class="font-medium text-highlighted">{{ item.label }}</span>
        <span class="text-xs text-muted">{{ item.description }}</span>
      </span>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/application/stores/auth.store';
import { useModels } from '@/application/composables/useModels';

const model = defineModel<string | undefined>();

const auth = useAuthStore();
const { data } = useModels();

const items = computed(() =>
  (data.value?.models ?? []).map((item) => ({
    value: item.id,
    label: item.label,
    description: item.description,
  })),
);

// Sans choix explicite : le modèle préféré de l'utilisateur, sinon celui du serveur
const selected = computed({
  get: () => model.value ?? auth.user?.preferredModel ?? data.value?.defaultModel,
  set: (value) => (model.value = value),
});
</script>

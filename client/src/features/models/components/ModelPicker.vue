<template>
  <div v-if="supported && items.length" class="flex min-w-0 items-center">
    <USelectMenu
      v-model="selected"
      :items="items"
      value-key="value"
      :search-input="false"
      color="neutral"
      variant="ghost"
      size="sm"
      :content="{ align: 'start', side: 'top' }"
      :ui="{ content: 'min-w-0 sm:min-w-96', value: 'truncate' }"
      aria-label="Modèle d'IA"
      class="w-auto min-w-0"
    >
      <template #item="{ item }">
        <span class="flex min-w-0 flex-col gap-0.5 py-0.5">
          <span class="flex items-baseline gap-2">
            <span class="truncate text-sm font-medium text-highlighted">{{ item.label }}</span>
            <span class="shrink-0 text-xs text-dimmed">{{ item.size }}</span>
          </span>
          <span class="truncate text-xs text-muted">{{ item.description }}</span>
          <span v-if="item.strengths" class="truncate text-xs text-dimmed">
            {{ item.strengths }}
          </span>
        </span>
      </template>
    </USelectMenu>

    <UPopover v-if="current" :content="{ align: 'end', side: 'top' }">
      <UButton
        icon="i-lucide-info"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="`Capacités de ${current.label}`"
      />
      <template #content>
        <div class="w-80 max-w-[calc(100vw-2rem)] p-3">
          <p class="mb-2 text-sm font-medium text-highlighted">{{ current.label }}</p>
          <ModelProfile :model="current" />
        </div>
      </template>
    </UPopover>
  </div>

  <UTooltip v-else text="Essayez Chrome, Edge, Safari 26+ ou Firefox récent">
    <span class="px-2 text-xs text-muted">Navigateur sans WebGPU</span>
  </UTooltip>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UPopover from '@nuxt/ui/components/Popover.vue';
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/features/auth';
import { useGpuCapabilities } from '../composables/useGpuCapabilities';
import { useModels } from '../composables/useModels';
import { formatVram } from '../types/webgpu';
import ModelProfile from './ModelProfile.vue';

const model = defineModel<string | undefined>();

const auth = useAuthStore();
const { data, supported } = useModels();
const { missingFor, recommend } = useGpuCapabilities();

const available = computed(() => data.value?.models ?? []);

const items = computed(() =>
  available.value.map((item) => ({
    value: item.id,
    label: item.label,
    description: item.description,
    size: formatVram(item.vramMb),
    strengths: item.strengths.join(' · '),
    disabled: missingFor(item).length > 0,
  })),
);

const selected = computed({
  get: () =>
    model.value ??
    auth.user?.preferredModel ??
    recommend(available.value) ??
    data.value?.defaultModel,
  set: (value) => (model.value = value),
});

const current = computed(() => available.value.find((item) => item.id === selected.value));
</script>

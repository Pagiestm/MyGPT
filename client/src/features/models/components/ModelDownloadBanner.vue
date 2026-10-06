<template>
  <div
    v-if="download"
    class="mb-2 flex flex-col gap-1.5 rounded-(--radius-panel) border border-default bg-elevated/50 px-3 py-2"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center gap-2 text-sm">
      <UIcon name="i-lucide-download" class="size-4 shrink-0 text-dimmed" />
      <span class="text-highlighted">Préparation du modèle sur votre machine</span>
      <span class="ml-auto tabular-nums text-muted">{{ download.progress }} %</span>
    </div>
    <UProgress :model-value="download.progress" size="sm" />
    <p class="truncate text-xs text-muted">{{ download.text }}</p>
    <p class="text-xs text-dimmed">
      Téléchargement unique : le modèle restera en cache pour vos prochaines conversations.
    </p>
  </div>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import UProgress from '@nuxt/ui/components/Progress.vue';
import { useModelDownload } from '../composables/useModelDownload';

const { download } = useModelDownload();
</script>

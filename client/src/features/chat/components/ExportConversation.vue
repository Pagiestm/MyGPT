<template>
  <UTooltip text="Télécharger en Markdown">
    <UButton
      icon="i-lucide-download"
      color="neutral"
      variant="ghost"
      :href="url"
      aria-label="Télécharger la conversation en Markdown"
    />
  </UTooltip>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { computed } from 'vue';
import { apiUrl } from '@/shared/lib/http';

const props = defineProps<{ conversationId: string }>();

const url = computed(() => apiUrl(`/conversations/${props.conversationId}/export`));
</script>

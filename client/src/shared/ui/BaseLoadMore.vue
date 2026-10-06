<template>
  <div v-if="hasMore" class="flex justify-center py-2">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      :loading="loading"
      icon="i-lucide-chevron-down"
      @click="emit('more')"
    >
      {{ label }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';

withDefaults(defineProps<{ hasMore: boolean; loading?: boolean; label?: string }>(), {
  loading: false,
  label: 'Charger plus',
});

const emit = defineEmits<{ more: [] }>();
</script>

<template>
  <span
    class="flex max-w-60 items-center gap-2 rounded-card border border-default bg-default p-1.5 pe-3 text-xs has-[button]:pe-1.5"
  >
    <img v-if="preview" :src="preview" alt="" class="size-8 shrink-0 rounded-tile object-cover" />
    <span v-else class="grid size-8 shrink-0 place-items-center rounded-tile bg-elevated">
      <UIcon :name="fileIcon(mimeType)" class="size-4 text-muted" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate font-medium text-highlighted">{{ name }}</span>
      <span class="block text-dimmed">{{ detail }}</span>
    </span>
    <slot name="action" />
  </span>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import { fileIcon } from '@/domain/attachment';

defineProps<{ name: string; mimeType: string; detail: string; preview?: string }>();
</script>

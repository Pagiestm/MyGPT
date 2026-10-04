<template>
  <span class="inline-flex items-center gap-2 font-semibold tracking-tight text-highlighted">
    <svg :width="size" :height="size" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="9" class="fill-(--ui-bg-inverted)" />
      <path
        d="M11 27V13l9 9 9-9v14"
        fill="none"
        class="stroke-(--ui-bg)"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect x="30.5" y="23" width="3" height="7" rx="1.2" class="fill-(--ui-primary)" />
    </svg>
    <span v-if="!iconOnly" :class="textClass">MyGPT</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; iconOnly?: boolean; textClass?: string }>(), {
  size: 28,
  iconOnly: false,
  textClass: 'text-lg',
});
</script>

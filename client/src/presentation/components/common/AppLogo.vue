<template>
  <span class="inline-flex items-center gap-2 font-semibold tracking-tight text-highlighted">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M9 3h14a7 7 0 0 1 7 7v8a7 7 0 0 1-7 7H13l-6.2 4.6A1 1 0 0 1 5.2 28.8V24.3A7 7 0 0 1 2 18v-8a7 7 0 0 1 7-7Zm7 4.5c.55 3.6 1.9 4.95 5.5 5.5-3.6.55-4.95 1.9-5.5 5.5-.55-3.6-1.9-4.95-5.5-5.5 3.6-.55 4.95-1.9 5.5-5.5Z"
      />
    </svg>
    <span v-if="!iconOnly" :class="textClass">MyGPT</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; iconOnly?: boolean; textClass?: string }>(), {
  size: 26,
  iconOnly: false,
  textClass: 'text-lg',
});
</script>

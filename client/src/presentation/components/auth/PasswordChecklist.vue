<template>
  <ul class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" aria-label="Critères de sécurité">
    <li
      v-for="rule in rules"
      :key="rule.label"
      class="flex items-center gap-1.5 transition-colors"
      :class="rule.valid ? 'text-success' : 'text-dimmed'"
    >
      <UIcon :name="rule.valid ? 'i-lucide-circle-check' : 'i-lucide-circle'" class="size-3.5" />
      {{ rule.label }}
      <span class="sr-only">{{ rule.valid ? '(respectée)' : '(non respectée)' }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue';
import { computed } from 'vue';
import { PASSWORD_RULES } from '@/domain/user';

const props = defineProps<{ password: string }>();

const rules = computed(() =>
  PASSWORD_RULES.map((rule) => ({ label: rule.label, valid: rule.test(props.password) })),
);
</script>

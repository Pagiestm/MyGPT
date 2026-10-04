<template>
  <figure class="not-prose my-3 overflow-hidden rounded-md border border-default">
    <figcaption
      class="flex items-center justify-between border-b border-default bg-elevated px-3 py-1.5"
    >
      <span class="font-mono text-xs text-muted">{{ language }}</span>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? 'Code copié' : 'Copier le code'"
        @click="copy(node.code)"
      />
    </figcaption>
    <!-- eslint-disable-next-line vue/no-v-html -- HTML généré par Shiki à partir du code échappé -->
    <div v-if="html" class="code-block overflow-x-auto text-sm" v-html="html" />
    <pre
      v-else
      class="overflow-x-auto bg-muted p-4 font-mono text-sm"
    ><code>{{ node.code }}</code></pre>
  </figure>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import { computed, ref, watchEffect } from 'vue';
import { useClipboard } from '@vueuse/core';

const props = defineProps<{ node: { language: string; code: string; loading?: boolean } }>();

const language = computed(() => props.node.language || 'text');
const html = ref('');
const { copy, copied } = useClipboard();

watchEffect(async () => {
  const { code } = props.node;
  const lang = language.value;
  if (props.node.loading) return;
  const { codeToHtml } = await import('shiki');
  const themes = { light: 'github-light', dark: 'github-dark' };
  try {
    html.value = await codeToHtml(code, { lang, themes });
  } catch {
    html.value = await codeToHtml(code, { lang: 'text', themes });
  }
});
</script>

<style scoped>
.code-block :deep(pre) {
  margin: 0;
  padding: 1rem;
  font-family: var(--font-mono);
}

:global(.dark) .code-block :deep(.shiki),
:global(.dark) .code-block :deep(.shiki span) {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
</style>

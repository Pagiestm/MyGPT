<template>
  <MarkdownRender
    custom-id="chat"
    mode="chat"
    :content="content"
    :is-dark="isDark"
    class="message-content"
  />
</template>

<script setup lang="ts">
import MarkdownRender, { setCustomComponents } from 'markstream-vue';
import { useColorMode } from '@vueuse/core';
import { computed } from 'vue';
import CodeBlock from './CodeBlock.vue';

setCustomComponents('chat', { code_block: CodeBlock });

defineProps<{ content: string }>();

const mode = useColorMode();
const isDark = computed(() => mode.value === 'dark');
</script>

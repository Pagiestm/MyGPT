<template>
  <MarkdownRender
    custom-id="chat"
    mode="chat"
    :content="text"
    :final="done"
    :typewriter="reveal"
    :is-dark="isDark"
    class="message-content"
  />
</template>

<script setup lang="ts">
import MarkdownRender, { setCustomComponents } from 'markstream-vue';
import { useColorMode } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useRevealText } from '@/presentation/composables/useRevealText';
import CodeBlock from './CodeBlock.vue';

setCustomComponents('chat', { code_block: CodeBlock });

const props = defineProps<{ content: string; reveal?: boolean }>();
const emit = defineEmits<{ revealed: [] }>();

const { text, done } = useRevealText(
  () => props.content,
  () => props.reveal ?? false,
);

watch(done, (isDone) => {
  if (isDone && props.reveal) emit('revealed');
});

const mode = useColorMode();
const isDark = computed(() => mode.value === 'dark');
</script>

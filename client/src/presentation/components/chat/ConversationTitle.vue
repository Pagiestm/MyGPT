<template>
  <form v-if="editing" class="flex min-w-0 items-center gap-1" @submit.prevent="save">
    <UInput
      ref="input"
      v-model="draft"
      aria-label="Nom de la conversation"
      size="sm"
      class="w-64 max-w-full"
      @keydown.esc="editing = false"
      @blur="save"
    />
  </form>
  <span v-else class="flex min-w-0 items-center gap-1">
    <span class="truncate">{{ name }}</span>
    <UButton
      icon="i-lucide-pencil"
      color="neutral"
      variant="ghost"
      size="xs"
      aria-label="Renommer la conversation"
      @click="startEditing"
    />
  </span>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { nextTick, ref, useTemplateRef } from 'vue';

const props = defineProps<{ name: string }>();
const emit = defineEmits<{ rename: [name: string] }>();

const editing = ref(false);
const draft = ref('');
const input = useTemplateRef<{ inputRef: HTMLInputElement }>('input');

async function startEditing() {
  draft.value = props.name;
  editing.value = true;
  await nextTick();
  input.value?.inputRef.select();
}

function save() {
  if (!editing.value) return;
  editing.value = false;
  const name = draft.value.trim();
  if (name && name !== props.name) emit('rename', name);
}
</script>

<template>
  <UInput
    v-model="model"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    size="xl"
    class="w-full"
    :ui="{ trailing: 'pe-1' }"
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="visible ? 'Masquer les caractères' : 'Afficher les caractères'"
        :aria-pressed="visible"
        @click="visible = !visible"
      />
    </template>
  </UInput>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import { ref } from 'vue';

defineProps<{ autocomplete: 'current-password' | 'new-password' }>();
const model = defineModel<string>({ required: true });

const visible = ref(false);
</script>

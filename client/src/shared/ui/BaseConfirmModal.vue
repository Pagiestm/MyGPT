<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    @update:open="emit('update:open', $event)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('update:open', false)">
          Annuler
        </UButton>
        <UButton color="error" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UModal from '@nuxt/ui/components/Modal.vue';
defineProps<{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  loading?: boolean;
}>();

const emit = defineEmits<{ 'update:open': [value: boolean]; confirm: [] }>();
</script>

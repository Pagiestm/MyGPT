<template>
  <UPopover v-model:open="open" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="ghost"
      aria-label="Rechercher dans la conversation"
    />

    <template #content>
      <div class="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 p-2">
        <UInput
          v-model="keyword"
          icon="i-lucide-search"
          placeholder="Rechercher dans la conversation..."
          autofocus
          class="w-full"
          :loading="isLoading"
        />
        <p v-if="debounced && !results?.length && !isLoading" class="p-2 text-sm text-muted">
          Aucun message ne contient « {{ debounced }} »
        </p>
        <ul v-else-if="results?.length" class="max-h-72 overflow-y-auto">
          <li v-for="message in results" :key="message.id">
            <button
              type="button"
              class="w-full rounded-md p-2 text-left text-sm hover:bg-elevated"
              @click="select(message.id)"
            >
              <span class="block text-xs text-dimmed">
                {{ message.isFromAi ? 'MyGPT' : 'Vous' }}
              </span>
              <span class="line-clamp-2 text-toned">{{ message.content }}</span>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import UPopover from '@nuxt/ui/components/Popover.vue';
import { ref } from 'vue';
import { refDebounced } from '@vueuse/core';
import { useMessageSearch } from '@/application/composables/useMessages';

const props = defineProps<{ conversationId: string }>();
const emit = defineEmits<{ select: [messageId: string] }>();

const open = ref(false);
const keyword = ref('');
const debounced = refDebounced(keyword, 300);

const { data: results, isLoading } = useMessageSearch(() => props.conversationId, debounced);

function select(messageId: string) {
  open.value = false;
  emit('select', messageId);
}
</script>

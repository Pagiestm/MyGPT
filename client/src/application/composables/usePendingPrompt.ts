import { ref } from 'vue';
import type { Attachment } from '@/domain/attachment';

export interface PendingPrompt {
  content: string;
  attachments: Attachment[];
  model?: string;
}

const pending = ref<{ conversationId: string; prompt: PendingPrompt } | null>(null);

export function setPendingPrompt(conversationId: string, prompt: PendingPrompt) {
  pending.value = { conversationId, prompt };
}

export function takePendingPrompt(conversationId: string): PendingPrompt | null {
  if (pending.value?.conversationId !== conversationId) return null;
  const { prompt } = pending.value;
  pending.value = null;
  return prompt;
}

import { ref } from 'vue';

// Premier message saisi sur /chat, envoyé une fois la conversation créée et ouverte
const pending = ref<{ conversationId: string; content: string } | null>(null);

export function setPendingPrompt(conversationId: string, content: string) {
  pending.value = { conversationId, content };
}

export function takePendingPrompt(conversationId: string) {
  if (pending.value?.conversationId !== conversationId) return null;
  const { content } = pending.value;
  pending.value = null;
  return content;
}

import { ref } from 'vue';

// État partagé : la palette s'ouvre depuis la barre latérale ou avec Ctrl/⌘ + K
const isOpen = ref(false);

export function useCommandPalette() {
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
  };
}

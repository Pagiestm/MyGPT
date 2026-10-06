import { useSessionStorage } from '@vueuse/core';

const draft = useSessionStorage('mygpt:draft', '');

export function useDraftPrompt() {
  function take() {
    const value = draft.value;
    draft.value = '';
    return value;
  }

  return { draft, take };
}

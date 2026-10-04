import { useSessionStorage } from '@vueuse/core';

// Question saisie sur la page d'accueil, conservée le temps de se connecter
const draft = useSessionStorage('mygpt:draft', '');

export function useDraftPrompt() {
  function take() {
    const value = draft.value;
    draft.value = '';
    return value;
  }

  return { draft, take };
}

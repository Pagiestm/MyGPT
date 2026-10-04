import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { usePreferredReducedMotion } from '@vueuse/core';

/**
 * Écrit `text` caractère par caractère. Avec « réduire les animations »
 * activé côté système, le texte complet s'affiche immédiatement.
 */
export function useTypewriter(text: Ref<string>, { speed = 22, delay = 0 } = {}) {
  const reducedMotion = usePreferredReducedMotion();
  const output = ref('');
  const done = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function run(value: string) {
    clearTimeout(timer);
    done.value = false;
    output.value = '';
    if (reducedMotion.value === 'reduce') {
      output.value = value;
      done.value = true;
      return;
    }
    let index = 0;
    const tick = () => {
      output.value = value.slice(0, ++index);
      if (index < value.length) timer = setTimeout(tick, speed);
      else done.value = true;
    };
    timer = setTimeout(tick, delay);
  }

  watch(text, run, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));

  return { output, done };
}

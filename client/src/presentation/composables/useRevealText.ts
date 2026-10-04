import { onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { usePreferredReducedMotion } from '@vueuse/core';

const MAX_DURATION_MS = 4000;
const MIN_CHARS_PER_FRAME = 2;

/**
 * Dévoile un texte progressivement, comme s'il arrivait en flux.
 * Le serveur renvoie la réponse complète : l'effet est simulé côté client,
 * avec une durée plafonnée pour que les longues réponses ne traînent pas.
 */
export function useRevealText(source: MaybeRefOrGetter<string>, active: MaybeRefOrGetter<boolean>) {
  const reducedMotion = usePreferredReducedMotion();
  const text = ref(toValue(source));
  const done = ref(true);
  let frame: number | undefined;

  function stop() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  }

  function reveal(full: string) {
    stop();
    if (reducedMotion.value === 'reduce') {
      text.value = full;
      done.value = true;
      return;
    }

    const step = Math.max(MIN_CHARS_PER_FRAME, Math.ceil(full.length / (MAX_DURATION_MS / 16)));
    let length = 0;
    done.value = false;
    text.value = '';

    const tick = () => {
      length = Math.min(full.length, length + step);
      text.value = full.slice(0, length);
      if (length < full.length) frame = requestAnimationFrame(tick);
      else {
        frame = undefined;
        done.value = true;
      }
    };
    frame = requestAnimationFrame(tick);
  }

  watch(
    () => [toValue(source), toValue(active)] as const,
    ([full, isActive]) => {
      if (isActive) reveal(full);
      else {
        stop();
        text.value = full;
        done.value = true;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(stop);

  return { text, done };
}

import { onBeforeUnmount, ref } from 'vue';

// Le Markdown se lit mal à voix haute : on garde le texte, sans les blocs de code ni la syntaxe
function toSpeech(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' (bloc de code) ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[#>\-*+\s]+/gm, '')
    .replace(/[*_~]/g, '')
    .trim();
}

/** Lecture des réponses à voix haute (Web Speech API, voix française du système) */
export function useReadAloud() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speakingId = ref<string | null>(null);

  function stop() {
    if (supported) window.speechSynthesis.cancel();
    speakingId.value = null;
  }

  function toggle(id: string, markdown: string) {
    if (!supported) return;
    const wasSpeaking = speakingId.value === id;
    stop();
    if (wasSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(toSpeech(markdown));
    utterance.lang = 'fr-FR';
    utterance.onend = () => {
      if (speakingId.value === id) speakingId.value = null;
    };
    speakingId.value = id;
    window.speechSynthesis.speak(utterance);
  }

  onBeforeUnmount(stop);

  return { supported, speakingId, toggle, stop };
}

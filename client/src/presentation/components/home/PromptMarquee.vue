<template>
  <section class="border-y border-default bg-default py-6" aria-label="Exemples de questions">
    <div class="marquee flex overflow-hidden">
      <ul
        v-for="copy in 2"
        :key="copy"
        class="track flex shrink-0 gap-3 pr-3"
        :aria-hidden="copy === 2"
      >
        <li
          v-for="prompt in prompts"
          :key="prompt"
          class="flex items-center gap-2 rounded-full border border-default bg-muted px-4 py-2 text-sm whitespace-nowrap text-toned"
        >
          <span class="font-mono text-primary">›</span>
          {{ prompt }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const prompts = [
  'Explique-moi les closures en JavaScript',
  'Corrige cette requête SQL trop lente',
  'Résume cet article en 5 points',
  'Écris un test Jest pour ce service',
  'Traduis ce mail en anglais professionnel',
  'Propose un plan pour mon exposé',
  'Pourquoi mon useEffect boucle-t-il ?',
  'Convertis ce JSON en interface TypeScript',
];
</script>

<style scoped>
.marquee {
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

.track {
  animation: scroll 45s linear infinite;
}

.marquee:hover .track {
  animation-play-state: paused;
}

@keyframes scroll {
  to {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .track {
    animation: none;
  }
}
</style>

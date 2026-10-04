<template>
  <section id="features" class="py-24">
    <UContainer class="flex flex-col gap-12">
      <div class="flex max-w-2xl flex-col gap-3">
        <p class="font-mono text-sm text-primary">Fonctionnalités</p>
        <h2 class="text-3xl font-semibold tracking-tight text-balance text-highlighted sm:text-4xl">
          Pensé pour les longues conversations techniques, et les questions rapides.
        </h2>
      </div>

      <div class="grid gap-4 md:grid-cols-6">
        <article class="card md:col-span-4">
          <div class="card-text">
            <h3>Du code lisible, prêt à copier</h3>
            <p>Markdown complet et coloration syntaxique pour plus de 200 langages.</p>
          </div>
          <div
            class="overflow-hidden rounded-lg border border-default bg-stone-950 font-mono text-xs leading-relaxed"
          >
            <div
              class="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-stone-400"
            >
              <span>typescript</span>
              <UIcon name="i-lucide-copy" class="size-3.5" />
            </div>
            <pre
              class="overflow-x-auto p-3 text-stone-200"
            ><span class="text-violet-300">export function</span> <span class="text-cobalt-300">nameFromPrompt</span>(prompt: <span class="text-emerald-300">string</span>) {
  <span class="text-violet-300">const</span> text = prompt.trim()
  <span class="text-violet-300">return</span> text.length &gt; <span class="text-amber-300">60</span> ? text.slice(<span class="text-amber-300">0</span>, <span class="text-amber-300">59</span>) + <span class="text-emerald-300">'…'</span> : text
}</pre>
          </div>
        </article>

        <article class="card md:col-span-2">
          <div class="card-text">
            <h3>Tout se retrouve</h3>
            <p>Par titre de conversation ou dans les messages d'un long échange.</p>
          </div>
          <div class="flex flex-col gap-2 text-sm">
            <div
              class="flex items-center gap-2 rounded-md border border-default bg-default px-3 py-2 text-muted"
            >
              <UIcon name="i-lucide-search" class="size-4" /> docker
            </div>
            <p class="rounded-md bg-elevated px-3 py-2 text-toned">
              Monter le volume
              <mark class="rounded bg-primary/20 px-0.5 text-highlighted">docker</mark> en lecture
              seule…
            </p>
          </div>
        </article>

        <article class="card md:col-span-2">
          <div class="card-text">
            <h3>Partage en un lien</h3>
            <p>Lecture seule, sans compte, avec une date d'expiration si besoin.</p>
          </div>
          <div class="flex flex-col gap-2 rounded-lg border border-default bg-default p-3 text-sm">
            <span class="truncate font-mono text-xs text-toned">mygpt.app/s/5e3e3366…</span>
            <span class="flex items-center gap-1.5 text-xs text-muted">
              <UIcon name="i-lucide-clock" class="size-3.5" /> Expire dans 7 jours
            </span>
          </div>
        </article>

        <article class="card md:col-span-2">
          <div class="card-text">
            <h3>Questions modifiables</h3>
            <p>Reformulez une question : l'IA régénère la suite.</p>
          </div>
          <div class="flex flex-col gap-1.5 text-sm">
            <p class="self-end rounded-lg bg-elevated px-3 py-1.5 text-dimmed line-through">
              Explique Docker
            </p>
            <p class="self-end rounded-lg bg-primary px-3 py-1.5 text-inverted">
              Explique Docker à un débutant
            </p>
          </div>
        </article>

        <article class="card md:col-span-2">
          <div class="card-text">
            <h3>Clair ou sombre</h3>
            <p>Suit le thème de votre système, ou celui que vous choisissez.</p>
          </div>
          <div class="grid grid-cols-2 overflow-hidden rounded-lg border border-default text-xs">
            <div class="flex items-center gap-2 bg-white p-3 text-stone-900">
              <UIcon name="i-lucide-sun" /> Clair
            </div>
            <div class="flex items-center gap-2 bg-stone-900 p-3 text-white">
              <UIcon name="i-lucide-moon" /> Sombre
            </div>
          </div>
        </article>
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import UContainer from '@nuxt/ui/components/Container.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  min-width: 0;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 1rem;
  background: var(--ui-bg-muted);
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.card-text h3 {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.card-text p {
  font-size: 0.925rem;
  color: var(--ui-text-muted);
}
</style>

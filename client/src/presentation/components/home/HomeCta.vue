<template>
  <section class="px-4 pb-20">
    <div
      v-reveal
      class="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl bg-muted px-6 py-16 text-center"
    >
      <AppLogo icon-only :size="40" />
      <h2 class="max-w-xl text-3xl font-semibold tracking-tight text-balance text-highlighted">
        Posez votre première question dès maintenant
      </h2>
      <p class="text-muted">Gratuit, et vous pouvez tout supprimer à tout moment.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <template v-if="auth.isAuthenticated">
          <UButton
            :to="{ name: 'new-chat' }"
            size="lg"
            class="rounded-full"
            label="Ouvrir le chat"
          />
        </template>
        <template v-else>
          <UButton
            :to="{ name: 'register' }"
            size="lg"
            class="rounded-full"
            label="Créer un compte gratuit"
          />
          <UButton
            :to="{ name: 'login' }"
            size="lg"
            color="neutral"
            variant="outline"
            class="rounded-full"
            label="J'ai déjà un compte"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import { useAuthStore } from '@/application/stores/auth.store';
import AppLogo from '@/presentation/components/common/AppLogo.vue';

const auth = useAuthStore();
</script>

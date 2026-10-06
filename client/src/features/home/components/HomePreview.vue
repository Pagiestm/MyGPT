<template>
  <section class="px-4 pb-20">
    <div v-reveal class="mx-auto max-w-6xl rounded-panel bg-muted p-3 sm:p-6">
      <ChatDemo with-sidebar height="22rem" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ChatDemo from '@/shared/ui/ChatDemo.vue';
import { vReveal } from '@/features/home/directives/reveal';
</script>

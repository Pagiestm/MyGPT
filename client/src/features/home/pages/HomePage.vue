<template>
  <HomeHero />
  <HomePreview />
  <HomeUseCases />
  <HomeFeatures />
  <HomeSteps />
  <HomePrivacy />
  <FaqSection />
  <HomeCta />
</template>

<script setup lang="ts">
import FaqSection from '@/features/home/components/FaqSection.vue';
import HomeCta from '@/features/home/components/HomeCta.vue';
import HomeFeatures from '@/features/home/components/HomeFeatures.vue';
import HomeHero from '@/features/home/components/HomeHero.vue';
import HomePreview from '@/features/home/components/HomePreview.vue';
import HomePrivacy from '@/features/home/components/HomePrivacy.vue';
import HomeSteps from '@/features/home/components/HomeSteps.vue';
import HomeUseCases from '@/features/home/components/HomeUseCases.vue';
</script>

// src/views/Home.vue
<script setup lang="ts">
import HeroSection from '../components/home/HeroSection.vue';
import FeaturesSection from '../components/home/FeaturesSection.vue';
import HowItWorksSection from '../components/home/HowItWorksSection.vue';
import TestimonialsSection from '../components/home/TestimonialsSection.vue';
import FaqSection from '../components/home/FaqSection.vue';
import CTASection from '../components/home/CTASection.vue';
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <CTASection />
    </div>
</template>

<style>
@keyframes float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-20px);
    }

    100% {
        transform: translateY(0px);
    }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}
</style>

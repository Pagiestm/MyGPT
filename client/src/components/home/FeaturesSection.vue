// src/components/home/FeaturesSection.vue
<script setup lang="ts">
import SectionTitle from '../common/SectionTitle.vue';
import FeatureCard from '../common/FeatureCard.vue';

const features = [
    {
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        title: 'Intelligence avancée',
        description:
            'Notre IA comprend le contexte et génère des réponses pertinentes et précises.'
    },
    {
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        title: 'Réponses instantanées',
        description:
            "Obtenez des réponses en temps réel, sans délai d'attente frustrant."
    },
    {
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        title: 'Sécurité renforcée',
        description:
            'Vos conversations sont protégées et vos données restent confidentielles.'
    },
    {
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Historique complet',
        description:
            "Accédez à l'historique de vos conversations quand vous en avez besoin."
    }
];
</script>

<template>
    <section class="py-20">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
                title="Fonctionnalités puissantes"
                subtitle="Découvrez ce que MyGPT peut faire pour vous"
            />

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard
                    v-for="(feature, index) in features"
                    :key="`feature-${index}`"
                    :icon="feature.icon"
                    :title="feature.title"
                    :description="feature.description"
                />
            </div>
        </div>
    </section>
</template>

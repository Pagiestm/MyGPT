<template>
    <section class="py-20 bg-gray-50">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
                title="Comment ça marche"
                subtitle="Une expérience simple en trois étapes"
            />

            <div
                class="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto mb-16"
            >
                <template v-for="(step, index) in steps" :key="`step-${index}`">
                    <div
                        class="bg-white rounded-xl shadow-md p-8 mb-8 md:mb-0 w-full md:w-auto md:flex-1 border border-gray-100 hover:border-indigo-100 transition-all duration-300"
                    >
                        <div
                            class="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto"
                        >
                            {{ step.number }}
                        </div>
                        <h3
                            class="text-xl font-semibold text-gray-900 text-center mb-3"
                        >
                            {{ step.title }}
                        </h3>
                        <p class="text-gray-600 text-center">
                            {{ step.description }}
                        </p>
                    </div>

                    <div
                        v-if="index < steps.length - 1"
                        class="hidden md:block text-indigo-400 mx-4"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </div>
                </template>
            </div>

            <!-- Chat Demo -->
            <div
                class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
            >
                <div class="p-6">
                    <div class="flex justify-end mb-4">
                        <div
                            class="bg-indigo-500 text-white rounded-lg py-2 px-4 max-w-xs"
                        >
                            <p>
                                Comment puis-je améliorer ma productivité au
                                travail ?
                            </p>
                        </div>
                    </div>
                    <div class="flex mb-4">
                        <div class="bg-gray-100 rounded-lg py-2 px-4 max-w-md">
                            <p>
                                Pour améliorer votre productivité, je vous
                                recommande la méthode Pomodoro : travaillez 25
                                minutes sans interruptions, puis prenez une
                                pause de 5 minutes. Organisez vos tâches par
                                priorité et éliminez les distractions numériques
                                pendant vos sessions de travail.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import SectionTitle from '../common/SectionTitle.vue';

interface Step {
    number: number;
    title: string;
    description: string;
}

const steps: Step[] = [
    {
        number: 1,
        title: 'Inscrivez-vous',
        description:
            'Créez votre compte en quelques secondes et accédez à votre espace personnel.'
    },
    {
        number: 2,
        title: 'Posez vos questions',
        description:
            'Interagissez avec MyGPT en langage naturel comme avec un interlocuteur humain.'
    },
    {
        number: 3,
        title: 'Obtenez des réponses',
        description:
            'Recevez des réponses pertinentes, précises et contextuelles instantanément.'
    }
];
</script>

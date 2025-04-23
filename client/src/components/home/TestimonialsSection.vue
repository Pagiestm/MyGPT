<template>
    <section class="py-20">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
                title="Ce qu'en disent nos utilisateurs"
                subtitle="Des témoignages de personnes qui utilisent MyGPT au quotidien"
            />

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div
                    v-for="(testimonial, index) in testimonials"
                    :key="`testimonial-${index}`"
                    class="bg-white rounded-xl shadow-md p-6 relative border border-gray-100 hover:border-indigo-100 transition-all duration-300"
                >
                    <div class="text-gray-600 mb-8 relative">
                        <svg
                            class="absolute -top-4 -left-4 h-10 w-10 text-indigo-200 transform -rotate-12 z-0"
                            fill="currentColor"
                            viewBox="0 0 32 32"
                        >
                            <path
                                d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"
                            />
                        </svg>
                        <div class="relative z-10 pt-4 pl-4">
                            "{{ testimonial.content }}"
                        </div>
                    </div>
                    <div class="flex items-center">
                        <img
                            :src="testimonial.author.image"
                            :alt="testimonial.author.name"
                            class="h-12 w-12 rounded-full mr-4 border-2 border-indigo-100"
                        />
                        <div>
                            <h4 class="font-semibold text-gray-900">
                                {{ testimonial.author.name }}
                            </h4>
                            <p class="text-indigo-500 text-sm">
                                {{ testimonial.author.role }}
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

interface Testimonial {
    content: string;
    author: {
        name: string;
        role: string;
        image: string;
    };
}

const testimonials: Testimonial[] = [
    {
        content:
            "MyGPT m'a aidé à résoudre des problèmes complexes de programmation. Les explications sont claires et précises, ce qui me fait gagner énormément de temps.",
        author: {
            name: 'Sophie Martin',
            role: 'Développeuse Web',
            image: 'https://randomuser.me/api/portraits/women/44.jpg'
        }
    },
    {
        content:
            'En tant que professionnel du marketing, MyGPT est devenu mon assistant virtuel indispensable pour rédiger des contenus engageants et générer des idées créatives.',
        author: {
            name: 'Thomas Durand',
            role: 'Responsable marketing',
            image: 'https://randomuser.me/api/portraits/men/46.jpg'
        }
    },
    {
        content:
            "L'interface intuitive et les réponses précises de MyGPT m'ont permis d'améliorer considérablement mes compétences en rédaction et en recherche.",
        author: {
            name: 'Léa Bernard',
            role: 'Étudiante en master',
            image: 'https://randomuser.me/api/portraits/women/65.jpg'
        }
    }
];
</script>

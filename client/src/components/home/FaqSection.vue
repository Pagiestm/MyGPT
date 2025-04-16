<template>
    <section class="py-20 bg-gray-100">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
                title="Questions fréquentes"
                subtitle="Tout ce que vous devez savoir sur MyGPT"
            />

            <div class="max-w-3xl mx-auto space-y-4">
                <div
                    v-for="(item, index) in faqItems"
                    :key="`faq-${index}`"
                    class="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                    <button
                        class="w-full flex justify-between items-center p-4 text-left font-medium focus:outline-none"
                        @click="toggleFaq(index)"
                    >
                        <span>{{ item.question }}</span>
                        <svg
                            class="h-6 w-6 text-blue-600 transform transition-transform duration-200"
                            :class="activeFaq === index ? 'rotate-180' : ''"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    <div
                        class="transition-all duration-300 max-h-0 overflow-hidden"
                        :class="activeFaq === index ? 'max-h-64 px-4 pb-4' : ''"
                    >
                        <p class="text-gray-600">{{ item.answer }}</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SectionTitle from '../common/SectionTitle.vue';

interface FaqItem {
    question: string;
    answer: string;
}

const activeFaq = ref<number | null>(null);

const faqItems: FaqItem[] = [
    {
        question: "Qu'est-ce que MyGPT ?",
        answer: "MyGPT est un assistant IA conversationnel basé sur la technologie GPT qui comprend et répond à vos questions en langage naturel, vous aidant dans diverses tâches comme la rédaction, la programmation, ou la recherche d'informations."
    },
    {
        question: 'Comment puis-je commencer à utiliser MyGPT ?',
        answer: "Pour commencer, inscrivez-vous gratuitement sur notre plateforme, confirmez votre adresse e-mail, puis connectez-vous à votre compte pour accéder à l'interface de conversation."
    },
    {
        question: 'MyGPT est-il disponible gratuitement ?',
        answer: 'Nous proposons une version gratuite avec des fonctionnalités de base et des forfaits premium pour les utilisateurs souhaitant des capacités avancées, un usage illimité et un support prioritaire.'
    },
    {
        question: 'Mes conversations sont-elles privées ?',
        answer: 'Absolument. La confidentialité est notre priorité. Vos conversations sont chiffrées et nous ne les partageons jamais avec des tiers. Vous pouvez également supprimer votre historique à tout moment.'
    },
    {
        question: "MyGPT peut-il être intégré à d'autres outils ?",
        answer: "Oui, MyGPT propose une API permettant l'intégration avec diverses applications et plateformes. Consultez notre documentation pour les instructions détaillées d'intégration."
    },
    {
        question: "Comment puis-je obtenir de l'aide si j'ai un problème ?",
        answer: "Notre équipe de support est disponible via le centre d'aide. Les utilisateurs premium bénéficient également d'un support prioritaire par e-mail et chat en direct."
    }
];

const toggleFaq = (index: number): void => {
    activeFaq.value = activeFaq.value === index ? null : index;
};
</script>

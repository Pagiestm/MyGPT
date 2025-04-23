<template>
    <div class="min-h-screen bg-white px-4 py-12 md:py-16 overflow-y-auto">
        <div class="text-center max-w-2xl mx-auto">
            <!-- En-tête -->
            <div class="mb-4 md:mb-6">
                <div
                    class="text-4xl md:text-6xl text-indigo-500 mb-3 md:mb-2 animate-float inline-block"
                >
                    <i class="fas fa-robot"></i>
                </div>
            </div>

            <!-- Titre et description -->
            <h1
                class="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3"
            >
                Bienvenue sur MyGPT
            </h1>
            <p class="text-base md:text-xl text-gray-600 mb-6 md:mb-8 px-2">
                Commencez une conversation avec notre intelligence artificielle
                pour obtenir des réponses à vos questions, explorer des idées ou
                simplement discuter.
            </p>

            <!-- Bouton pour consulter les conversations -->
            <button
                class="mb-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all font-medium flex items-center mx-auto md:hidden"
                @click="toggleSidebar"
            >
                <i class="fas fa-comments mr-2"></i>
                Consulter mes conversations
            </button>

            <!-- Grille de fonctionnalités -->
            <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-left"
            >
                <div
                    class="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="text-indigo-500 text-xl mb-2">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-800 mb-1">
                        Demandez n'importe quoi
                    </h3>
                    <p class="text-gray-600 text-sm">
                        L'IA peut répondre à vos questions, expliquer des
                        concepts complexes ou vous aider dans vos projets.
                    </p>
                </div>

                <!-- Fonctionnalité 2 -->
                <div
                    class="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="text-indigo-500 text-xl mb-2">
                        <i class="fas fa-history"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-800 mb-1">
                        Historique complet
                    </h3>
                    <p class="text-gray-600 text-sm">
                        Retrouvez facilement toutes vos conversations passées
                        dans la barre latérale.
                    </p>
                </div>

                <!-- Fonctionnalité 3 -->
                <div
                    class="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="text-indigo-500 text-xl mb-2">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-800 mb-1">
                        Recherche intuitive
                    </h3>
                    <p class="text-gray-600 text-sm">
                        Retrouvez rapidement vos conversations par mots-clés ou
                        sujets.
                    </p>
                </div>

                <!-- Fonctionnalité 4 -->
                <div
                    class="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div class="text-indigo-500 text-xl mb-2">
                        <i class="fas fa-share-alt"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-800 mb-1">
                        Partage facile
                    </h3>
                    <p class="text-gray-600 text-sm">
                        Partagez vos conversations avec d'autres personnes en
                        quelques clics.
                    </p>
                </div>
            </div>

            <!-- Mentions mobiles supplémentaires -->
            <p class="text-xs text-gray-400 mt-8 md:mt-10">
                MyGPT s'adapte à tous vos appareils pour vous accompagner
                partout.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

// Récupérer la fonction toggleSidebar depuis le composant parent
const toggleSidebar = inject('toggleSidebar', () => {});
</script>

<style scoped>
@keyframes float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }

    100% {
        transform: translateY(0px);
    }
}

.animate-float {
    animation: float 4s ease-in-out infinite;
}
</style>

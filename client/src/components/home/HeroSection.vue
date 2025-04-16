<template>
    <section class="bg-gradient-to-r from-blue-50 to-indigo-100 py-20">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row lg:items-center">
                <div class="lg:w-1/2 mb-10 lg:mb-0">
                    <h1
                        class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
                    >
                        Votre Assistant IA Personnel
                    </h1>
                    <p class="text-xl md:text-2xl text-gray-700 mb-8">
                        MyGPT transforme vos conversations textuelles en
                        expériences interactives puissantes
                    </p>
                    <div
                        class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                    >
                        <router-link
                            to="/register"
                            class="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            Commencer gratuitement
                        </router-link>
                        <router-link
                            to="/demo"
                            class="inline-flex justify-center items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            Voir la démo
                        </router-link>
                    </div>
                </div>
                <div
                    class="lg:w-1/2 flex justify-center lg:justify-end"
                >
                    <div
                        class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-2xl"
                    >
                        <!-- En-tête du chat -->
                        <div
                            class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center"
                        >
                            <div
                                class="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-white">
                                    MyGPT Assistant
                                </h3>
                                <p class="text-xs text-blue-100">
                                    En ligne maintenant
                                </p>
                            </div>
                        </div>

                        <!-- Corps du chat -->
                        <div
                            class="bg-gray-50 p-6 h-96 overflow-y-auto flex flex-col space-y-4"
                        >
                            <!-- Message de l'assistant -->
                            <div class="flex items-start">
                                <div
                                    class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0"
                                >
                                    <span class="text-xs font-bold text-white"
                                        >AI</span
                                    >
                                </div>
                                <div
                                    class="bg-white p-3 rounded-lg shadow-sm max-w-xs"
                                >
                                    <p class="text-gray-700">
                                        Bonjour ! Je suis MyGPT, votre assistant
                                        IA personnel. Comment puis-je vous aider
                                        aujourd'hui ?
                                    </p>
                                    <span
                                        class="text-xs text-gray-500 mt-1 block"
                                        >10:03</span
                                    >
                                </div>
                            </div>

                            <!-- Message de l'utilisateur -->
                            <div class="flex items-start justify-end">
                                <div
                                    class="bg-blue-600 p-3 rounded-lg shadow-sm max-w-xs"
                                >
                                    <p class="text-white">
                                        Peux-tu m'expliquer comment fonctionne
                                        l'intelligence artificielle ?
                                    </p>
                                    <span
                                        class="text-xs text-blue-200 mt-1 block"
                                        >10:04</span
                                    >
                                </div>
                            </div>

                            <!-- Message de l'assistant -->
                            <div class="flex items-start">
                                <div
                                    class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0"
                                >
                                    <span class="text-xs font-bold text-white"
                                        >AI</span
                                    >
                                </div>
                                <div
                                    class="bg-white p-3 rounded-lg shadow-sm max-w-xs animate-pulse-slow"
                                >
                                    <p class="text-gray-700">
                                        L'intelligence artificielle est un
                                        domaine qui vise à créer des machines
                                        capables d'imiter l'intelligence
                                        humaine. Elle utilise des algorithmes
                                        d'apprentissage pour...
                                    </p>
                                    <span
                                        class="text-xs text-gray-500 mt-1 block"
                                        >10:05</span
                                    >
                                </div>
                            </div>

                            <!-- Indicateur de saisie -->
                            <div class="flex items-center space-x-1 ml-10">
                                <div
                                    class="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-0"
                                ></div>
                                <div
                                    class="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-150"
                                ></div>
                                <div
                                    class="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-300"
                                ></div>
                            </div>
                        </div>

                        <!-- Zone de saisie -->
                        <div
                            class="bg-white px-4 py-4 border-t border-gray-200"
                        >
                            <div class="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    class="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                />
                                <button
                                    class="ml-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@keyframes pulse-slow {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

.animate-pulse-slow {
    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-0 {
    animation-delay: 0ms;
}

.delay-150 {
    animation-delay: 150ms;
}

.delay-300 {
    animation-delay: 300ms;
}

.bg-white\/20 {
    background-color: rgba(255, 255, 255, 0.2);
}

.overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(243, 244, 246, 0.5);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(209, 213, 219, 0.5);
    border-radius: 20px;
}
</style>

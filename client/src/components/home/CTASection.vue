<template>
    <section
        class="py-20 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white"
    >
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl sm:text-4xl font-bold mb-4">
                Prêt à transformer votre expérience conversationnelle ?
            </h2>
            <p class="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                Rejoignez des milliers d'utilisateurs qui profitent déjà de la
                puissance de MyGPT.
            </p>
            <div
                class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
                <router-link
                    to="/register"
                    class="inline-flex justify-center items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-all duration-200"
                >
                    S'inscrire gratuitement
                </router-link>
                <router-link
                    to="/login"
                    class="inline-flex justify-center items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-indigo-700 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-all duration-200"
                >
                    Se connecter
                </router-link>
            </div>
        </div>
    </section>
</template>

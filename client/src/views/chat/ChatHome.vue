<template>
    <div class="flex h-full items-center justify-center bg-white">
        <div class="text-center p-8 max-w-2xl">
            <div class="mb-6">
                <div
                    class="text-6xl text-primary mb-4 animate-float inline-block"
                >
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-4">
                Bienvenue sur MyGPT
            </h1>
            <p class="text-xl text-gray-600 mb-8">
                Commencez une conversation avec notre intelligence artificielle
                pour obtenir des réponses à vos questions, explorer des idées ou
                simplement discuter.
            </p>

            <div class="mt-12 grid grid-cols-2 gap-6 text-left">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-primary text-xl mb-2">
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

                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-primary text-xl mb-2">
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

                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-primary text-xl mb-2">
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

                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-primary text-xl mb-2">
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
        </div>
    </div>
</template>

<style scoped>
@keyframes float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-15px);
    }

    100% {
        transform: translateY(0px);
    }
}

.animate-float {
    animation: float 4s ease-in-out infinite;
}
</style>

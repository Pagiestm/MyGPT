<template>
    <div
        class="min-h-screen flex flex-col bg-gradient-to-r from-indigo-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8"
    >
        <!-- Logo/Branding -->
        <div class="text-center mb-8">
            <h1
                class="text-4xl font-extrabold text-gray-900 flex items-center justify-center"
            >
                <span class="text-indigo-500 mr-2">My</span>GPT
            </h1>
            <p class="mt-2 text-lg text-gray-600">
                Votre assistant IA personnel
            </p>
        </div>

        <!-- Card principale -->
        <div
            class="max-w-md w-full mx-auto bg-white shadow-xl rounded-xl overflow-hidden"
        >
            <!-- En-tête -->
            <div
                class="px-6 py-8 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
            >
                <h2 class="text-2xl font-bold text-center">{{ title }}</h2>
                <p class="mt-2 text-indigo-100 text-center">{{ subtitle }}</p>
            </div>

            <!-- Contenu -->
            <div class="p-6 sm:p-8">
                <slot></slot>
            </div>

            <!-- Pied de carte -->
            <div
                class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center"
            >
                <span class="text-sm text-gray-600">{{ footerText }} </span>
                <router-link
                    :to="footerLink"
                    class="text-sm text-indigo-500 hover:text-indigo-700 font-medium ml-1"
                >
                    {{ footerLinkText }}
                </router-link>
            </div>
        </div>

        <!-- Illustration ou badge de confiance -->
        <div class="mt-10 text-center">
            <div class="flex items-center justify-center space-x-6">
                <div class="flex items-center">
                    <svg
                        class="h-8 w-8 text-indigo-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                        ></path>
                    </svg>
                    <span class="ml-2 text-sm text-gray-600">{{
                        securityBadgeText
                    }}</span>
                </div>
                <div class="flex items-center">
                    <svg
                        class="h-8 w-8 text-indigo-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"
                        ></path>
                    </svg>
                    <span class="ml-2 text-sm text-gray-600"
                        >Alimenté par IA avancée</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    footerText: {
        type: String,
        required: true
    },
    footerLink: {
        type: String,
        required: true
    },
    footerLinkText: {
        type: String,
        required: true
    },
    securityBadgeText: {
        type: String,
        default: 'Sécurisé'
    }
});
</script>

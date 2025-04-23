<template>
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div
                class="fixed inset-0 bg-black opacity-40"
                @click="emit('close')"
            ></div>

            <!-- Container du modal -->
            <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                <!-- En-tête -->
                <div
                    class="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 text-white rounded-t-xl"
                >
                    <h2 class="text-lg font-semibold">
                        Partager la conversation
                    </h2>
                    <p class="text-indigo-100 text-sm">
                        Créez un lien public pour partager cette conversation
                    </p>
                </div>

                <div class="p-6">
                    <!-- Si un lien existe déjà -->
                    <div v-if="shareLink" class="mb-6">
                        <h3 class="text-gray-700 font-medium mb-2">
                            Lien de partage
                        </h3>

                        <div class="flex mb-3">
                            <input
                                type="text"
                                readonly
                                :value="fullShareLink"
                                class="flex-1 p-3 border border-gray-300 rounded-l-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                class="px-4 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600 transition-colors flex items-center justify-center min-w-[48px]"
                                :class="{
                                    'bg-green-500 hover:bg-green-600': copied
                                }"
                                @click="copyToClipboard"
                            >
                                <i
                                    class="fas"
                                    :class="copied ? 'fa-check' : 'fa-copy'"
                                ></i>
                            </button>
                        </div>

                        <div
                            class="text-sm flex items-center mt-2 p-2 rounded-md"
                            :class="{
                                'bg-indigo-50 text-gray-500': !isLinkExpired,
                                'bg-red-50 text-red-600': isLinkExpired
                            }"
                        >
                            <i
                                class="fas mr-2"
                                :class="{
                                    'fa-clock text-indigo-400': !isLinkExpired,
                                    'fa-exclamation-circle text-red-500':
                                        isLinkExpired
                                }"
                            ></i>
                            {{ expirationText }}
                        </div>
                    </div>

                    <!-- Options de configuration -->
                    <div class="mb-6">
                        <h3 class="text-gray-700 font-medium mb-3">
                            Configurer le partage
                        </h3>

                        <div class="mb-4">
                            <label class="block text-gray-600 text-sm mb-2"
                                >Expiration du lien</label
                            >
                            <select
                                v-model="expirationOption"
                                class="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                                <option value="never">Jamais</option>
                                <option value="1day">1 jour</option>
                                <option value="7days">7 jours</option>
                                <option value="30days">30 jours</option>
                                <option value="custom">Personnalisé</option>
                            </select>
                        </div>

                        <div
                            v-if="expirationOption === 'custom'"
                            class="mb-4 border-t pt-3 border-gray-100"
                        >
                            <label class="block text-gray-600 text-sm mb-2"
                                >Date d'expiration</label
                            >
                            <input
                                v-model="customExpirationDate"
                                type="date"
                                class="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <!-- Séparateur -->
                    <div class="border-t border-gray-200 my-4"></div>

                    <!-- Actions -->
                    <div
                        class="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0"
                    >
                        <button
                            v-if="shareLink"
                            class="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center sm:justify-start"
                            @click="revokeShareLink"
                        >
                            <i class="fas fa-unlink mr-1.5"></i>
                            Révoquer
                        </button>

                        <div
                            :class="{ 'sm:ml-auto': shareLink }"
                            class="flex flex-row justify-end space-x-2"
                        >
                            <button
                                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                @click="emit('close')"
                            >
                                Annuler
                            </button>

                            <button
                                class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-70"
                                :disabled="isLoading"
                                @click="generateShareLink"
                            >
                                <span v-if="isLoading">
                                    <i
                                        class="fas fa-spinner fa-spin mr-1.5"
                                    ></i>
                                    Traitement...
                                </span>
                                <span v-else-if="shareLink">
                                    <i class="fas fa-refresh mr-1.5"></i>
                                    Mettre à jour
                                </span>
                                <span v-else>
                                    <i class="fas fa-link mr-1.5"></i>
                                    Générer
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Database from '../../utils/database.utils';
import { useToast } from 'vue-toastification';

const props = defineProps<{
    conversationId: string;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const toast = useToast();
const shareLink = ref<string | null>(null);
const expirationDate = ref<Date | null>(null);
const expirationOption = ref('never');
const customExpirationDate = ref('');
const isLoading = ref(false);
const copied = ref(false);

// URL complète du partage
const fullShareLink = computed(() => {
    if (!shareLink.value) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/chat/shared/${shareLink.value}`;
});

// Texte d'expiration formaté
const expirationText = computed(() => {
    if (!expirationDate.value) return "Ce lien n'expire jamais";

    const now = new Date();
    const expiry = new Date(expirationDate.value);

    // Si la date est dépassée
    if (expiry < now) {
        return 'Ce lien a expiré';
    }

    // Calculer la différence en jours
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Ce lien expire aujourd'hui";
    } else if (diffDays === 1) {
        return 'Ce lien expire demain';
    } else {
        return `Ce lien expire dans ${diffDays} jours`;
    }
});

// Vérifie si le lien a expiré
const isLinkExpired = computed(() => {
    if (!expirationDate.value) return false;
    const now = new Date();
    const expiry = new Date(expirationDate.value);
    return expiry < now;
});

// Calcule la date d'expiration en fonction de l'option sélectionnée
function getExpirationDate(): string | undefined {
    switch (expirationOption.value) {
        case 'never':
            return undefined;
        case '1day': {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            return date.toISOString();
        }
        case '7days': {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            return date.toISOString();
        }
        case '30days': {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toISOString();
        }
        case 'custom': {
            if (!customExpirationDate.value) return undefined;
            const date = new Date(customExpirationDate.value);
            return date.toISOString();
        }
        default:
            return undefined;
    }
}

// Génére ou mettre à jour un lien de partage
async function generateShareLink() {
    isLoading.value = true;
    try {
        const expiresAt = getExpirationDate();
        const response = await Database.create(
            `conversations/${props.conversationId}/share`,
            {
                expiresAt
            }
        );

        // Mettre à jour l'état immédiatement
        shareLink.value = response.data.shareLink;
        if (expiresAt) {
            expirationDate.value = new Date(expiresAt);
        } else {
            expirationDate.value = null;
        }

        // Attendre que Vue termine son cycle de rendu
        setTimeout(() => {
            // Sélectionner l'input pour faciliter la copie
            const inputElement = document.querySelector(
                'input[readonly]'
            ) as HTMLInputElement;
            if (inputElement) {
                inputElement.focus();
                inputElement.select();
            }
        }, 50);
    } catch (error) {
        console.error('Erreur lors de la génération du lien de partage', error);
        toast.error('Erreur lors de la création du lien de partage');
    } finally {
        isLoading.value = false;
    }
}

// Révoque un lien de partage
async function revokeShareLink() {
    isLoading.value = true;
    try {
        await Database.delete(`conversations/${props.conversationId}/share`);
        shareLink.value = null;
        expirationDate.value = null;
    } catch (error) {
        console.error('Erreur lors de la révocation du lien de partage', error);
        toast.error('Erreur lors de la révocation du lien de partage');
    } finally {
        isLoading.value = false;
    }
}

// Copie le lien dans le presse-papier
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(fullShareLink.value);
        copied.value = true;

        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch (error) {
        console.error('Impossible de copier le lien', error);
        toast.error('Erreur lors de la copie du lien');
    }
}

// Vérifie si un lien de partage existe déjà lors du chargement
async function checkExistingShareLink() {
    isLoading.value = true;
    try {
        const conversation = await Database.getAll(
            `conversations/${props.conversationId}`
        );

        if (conversation && conversation.shareLink) {
            shareLink.value = conversation.shareLink;

            if (conversation.shareExpiresAt) {
                expirationDate.value = new Date(conversation.shareExpiresAt);

                // Définir l'option d'expiration en fonction de la date existante
                const now = new Date();
                const expiry = new Date(conversation.shareExpiresAt);
                const diffDays = Math.ceil(
                    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (diffDays <= 1) expirationOption.value = '1day';
                else if (diffDays <= 7) expirationOption.value = '7days';
                else if (diffDays <= 30) expirationOption.value = '30days';
                else expirationOption.value = 'custom';

                if (expirationOption.value === 'custom') {
                    customExpirationDate.value = expiry
                        .toISOString()
                        .split('T')[0];
                }
            } else {
                expirationOption.value = 'never';
                expirationDate.value = null;
            }
        }
    } catch (error) {
        console.error(
            'Erreur lors de la récupération des informations de partage',
            error
        );
    } finally {
        isLoading.value = false;
    }
}

// Initialisation du composant
onMounted(() => {
    checkExistingShareLink();
});
</script>

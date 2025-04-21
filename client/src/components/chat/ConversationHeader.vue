<template>
    <header
        class="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm"
    >
        <!-- Bouton menu sur mobile -->
        <button
            class="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100"
            @click="$emit('toggle-sidebar')"
        >
            <i class="fas fa-bars"></i>
        </button>

        <div class="flex-1 group">
            <!-- Mode affichage -->
            <h1
                v-if="!isEditing"
                class="font-semibold text-lg md:text-xl text-gray-800 flex items-center"
                :class="{ 'ml-2': isMobileView }"
            >
                <!-- Titre tronqué sur mobile -->
                <span
                    class="truncate max-w-[12rem] sm:max-w-[16rem] md:max-w-[24rem] lg:max-w-[32rem] xl:max-w-[40rem]"
                    >{{ title }}</span
                >
                <button
                    class="ml-2 p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                    @click="startEdit"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="w-4 h-4"
                    >
                        <path
                            d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                        />
                    </svg>
                </button>
            </h1>

            <!-- Mode édition - adapté pour mobile -->
            <div
                v-else
                class="relative inline-block ml-0 md:ml-0"
                :class="{ 'ml-2': isMobileView }"
            >
                <input
                    ref="inputRef"
                    v-model="editValue"
                    type="text"
                    placeholder="Nom de la conversation"
                    class="w-36 sm:w-40 md:w-48 px-2 py-1 text-base md:text-lg font-medium bg-white rounded-lg border-0 border-b-2 border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-0 transition-all duration-200 focus:w-44 sm:focus:w-48 md:focus:w-56"
                    @keyup.enter="updateTitle"
                    @keyup.esc="isEditing = false"
                    @blur="updateTitle"
                />
            </div>
        </div>

        <div class="flex items-center space-x-1 md:space-x-3 ml-2 md:ml-4">
            <!-- Bouton de recherche -->
            <button
                class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                title="Rechercher dans la conversation"
                @click="$emit('toggleSearch')"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="w-5 h-5"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>

            <div class="relative md:hidden">
                <button
                    class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                    data-mobile-menu-button
                    @click="showMobileMenu = !showMobileMenu"
                >
                    <i class="fas fa-ellipsis-v"></i>
                </button>

                <!-- Menu dropdown mobile -->
                <div
                    v-if="showMobileMenu"
                    class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200"
                    data-mobile-menu-content
                >
                    <a
                        href="/"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-500"
                    >
                        <i class="fas fa-home mr-2"></i> Accueil
                    </a>
                    <a
                        href="/profile"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-500"
                    >
                        <i class="fas fa-user mr-2"></i> Mon profil
                    </a>
                    <a
                        href="#"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-500"
                    >
                        <i class="fas fa-share-alt mr-2"></i> Partager
                    </a>
                </div>
            </div>

            <!-- Boutons de navigation - visibles sur tablette/desktop -->
            <div class="hidden md:flex items-center space-x-1 md:space-x-3">
                <button
                    class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                    title="Accueil"
                    @click="router.push('/')"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="w-5 h-5"
                    >
                        <path
                            d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"
                        />
                        <path
                            d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"
                        />
                    </svg>
                </button>

                <button
                    class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                    title="Mon profil"
                    @click="router.push('/profile')"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="w-5 h-5"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>

                <button
                    class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
                    title="Partager"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="w-5 h-5"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps<{ title: string }>();
const emit = defineEmits<{
    (e: 'update:title', title: string): void;
    (e: 'toggleSearch'): void;
    (e: 'toggle-sidebar'): void;
}>();

// État
const isEditing = ref(false);
const editValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const isUpdating = ref(false);
const showMobileMenu = ref(false);
const isMobileView = ref(window.innerWidth < 768);

// Gestion du responsive
function checkMobileView() {
    isMobileView.value = window.innerWidth < 768;
}

onMounted(() => {
    window.addEventListener('resize', checkMobileView);
    document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobileView);
    document.removeEventListener('click', handleOutsideClick);
});

// Fermer le menu mobile quand on clique ailleurs
function handleOutsideClick(event: MouseEvent) {
    if (showMobileMenu.value) {
        const target = event.target as HTMLElement;
        // Vérifier si le clic provient du bouton de menu ou du contenu du menu
        const isMenuButton = target.closest('[data-mobile-menu-button]');
        const isMenuContent = target.closest('[data-mobile-menu-content]');

        if (!isMenuButton && !isMenuContent) {
            showMobileMenu.value = false;
        }
    }
}

// Démarrer l'édition du titre
function startEdit() {
    editValue.value = props.title;
    isEditing.value = true;
    nextTick(() => inputRef.value?.focus());
}

// Mettre à jour le titre (une seule fois)
function updateTitle() {
    if (isUpdating.value) return;
    isUpdating.value = true;

    // Valeur par défaut si vide
    const newTitle = editValue.value.trim() || 'Nouvelle conversation';

    emit('update:title', newTitle);
    isEditing.value = false;

    // Réinitialiser après un court délai
    setTimeout(() => (isUpdating.value = false), 100);
}
</script>

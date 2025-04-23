<template>
    <div class="mt-3 mb-4 rounded-lg overflow-hidden shadow-sm relative">
        <!-- En-tête -->
        <div
            class="flex items-center justify-between bg-gray-700 text-gray-200 px-3 py-1.5 text-xs font-mono"
        >
            <span>{{ block.language || 'Code' }}</span>
            <div class="flex items-center">
                <!-- Bouton pour déplier/replier le code sur mobile -->
                <button
                    v-if="isMobile"
                    class="text-gray-300 hover:text-white transition-colors mr-3"
                    title="Déplier/Replier"
                    @click="isCollapsed = !isCollapsed"
                >
                    <i
                        class="fas"
                        :class="
                            isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'
                        "
                    ></i>
                </button>
                <!-- Bouton pour copier le code -->
                <button
                    class="text-gray-300 hover:text-white transition-colors"
                    title="Copier le code"
                    @click="copyCode"
                >
                    <i class="fas" :class="copied ? 'fa-check' : 'fa-copy'"></i>
                </button>
            </div>
        </div>

        <!-- Contenu du code (avec option de collapse sur mobile) -->
        <pre
            class="bg-gray-800 text-gray-100 text-sm font-mono w-full"
            :class="{
                'max-h-16 overflow-y-hidden': isCollapsed,
                'p-4': !isCollapsed,
                'p-2 pb-0': isCollapsed
            }"
        ><code class="block whitespace-pre-wrap break-words overflow-x-hidden text-left">{{ isCollapsed ? collapsedPreview : block.code }}</code></pre>

        <!-- Bouton "Voir plus" quand le code est réduit -->
        <div
            v-if="isCollapsed"
            class="bg-gray-800 text-gray-400 text-xs text-center py-1 cursor-pointer hover:text-white"
            @click="isCollapsed = false"
        >
            <i class="fas fa-ellipsis-h mr-1"></i> Voir plus
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Props & Emits
const props = defineProps<{
    block: {
        language: string;
        code: string;
    };
    isMobile: boolean;
    initiallyCollapsed?: boolean;
}>();

const emit = defineEmits(['copy']);

// État
const copied = ref(false);
const isCollapsed = ref(props.initiallyCollapsed || false);

// Code preview pour l'affichage collapsed
const collapsedPreview = computed(() => {
    const lines = props.block.code.split('\n');
    return lines.length <= 2 ? props.block.code : lines.slice(0, 2).join('\n');
});

// Copier le code dans le presse-papier
function copyCode() {
    navigator.clipboard.writeText(props.block.code);
    emit('copy', props.block.code);

    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
}
</script>

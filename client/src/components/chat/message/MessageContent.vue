<template>
    <div class="text-gray-800">
        <!-- Texte et listes formatés -->
        <div v-for="(part, index) in formattedParts" :key="`part-${index}`">
            <!-- Listes à puces -->
            <ul
                v-if="part.type === 'list'"
                class="pl-5 my-3 space-y-1 list-disc"
            >
                <li
                    v-for="(item, i) in part.items"
                    :key="`item-${i}`"
                    class="ml-1"
                >
                    <span
                        class="formatted-text"
                        :data-formatted-text="formatBoldText(item)"
                    ></span>
                </li>
            </ul>

            <!-- Texte normal -->
            <p v-else class="whitespace-pre-wrap break-words leading-relaxed">
                <span
                    class="formatted-text"
                    :data-formatted-text="formatBoldText(part.text || '')"
                ></span>
            </p>
        </div>

        <!-- Blocs de code -->
        <div
            v-for="(block, index) in codeBlocks"
            :key="`code-${index}`"
            class="mt-3 mb-4 rounded-lg overflow-hidden shadow-sm"
        >
            <!-- En-tête -->
            <div
                class="flex items-center justify-between bg-gray-700 text-gray-200 px-4 py-2 text-xs font-mono"
            >
                <span>{{ block.language || 'Code' }}</span>
                <button
                    class="text-gray-300 hover:text-white transition-colors"
                    title="Copier le code"
                    @click="copyCode(block.code, index)"
                >
                    <i
                        class="fas"
                        :class="copied === index ? 'fa-check' : 'fa-copy'"
                    ></i>
                </button>
            </div>

            <!-- Contenu du code -->
            <pre
                class="bg-gray-800 text-gray-100 p-4 text-sm overflow-x-auto leading-relaxed font-mono"
            ><code>{{ block.code }}</code></pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

// Types
interface FormattedPart {
    type: 'text' | 'list';
    text?: string;
    items?: string[];
}

interface CodeBlock {
    language: string;
    code: string;
}

// Props & Emits
const props = defineProps<{
    content: string;
    isFromAi: boolean;
}>();

const emit = defineEmits<{
    (e: 'copyCode', code: string): void;
}>();

// État
const copied = ref<number | null>(null);

// Regex pour les blocs de code
const CODE_BLOCK_REGEX = /```([a-zA-Z]*)\n([\s\S]*?)```/g;

// Créer un rendu sécurisé du texte formaté en gras à l'aide d'un directive personnalisée
onMounted(() => {
    const formattedElements = document.querySelectorAll('.formatted-text');
    formattedElements.forEach((element) => {
        if (element instanceof HTMLElement) {
            const text = element.dataset.formattedText || '';
            element.textContent = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Afficher le contenu sans les **
        }
    });
});

// Extraire les blocs de code du contenu
const codeBlocks = computed<CodeBlock[]>(() => {
    const blocks: CodeBlock[] = [];
    const content = props.content || '';
    let match;

    while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
        blocks.push({
            language: match[1] || 'text',
            code: match[2].trim()
        });
    }

    return blocks;
});

// Contenu sans les blocs de code
const contentWithoutCode = computed<string>(() => {
    return (props.content || '').replace(CODE_BLOCK_REGEX, '[CODE_BLOCK]');
});

// Parser le contenu et le formater
const formattedParts = computed<FormattedPart[]>(() => {
    const parts: FormattedPart[] = [];
    const lines = contentWithoutCode.value.split('\n');

    let currentText = '';
    let listItems: string[] = [];

    // Fonctions utilitaires pour finaliser les parties actuelles
    const finalizeText = () => {
        if (currentText) {
            parts.push({ type: 'text', text: currentText });
            currentText = '';
        }
    };

    const finalizeList = () => {
        if (listItems.length > 0) {
            parts.push({ type: 'list', items: [...listItems] });
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isLastLine = i === lines.length - 1;

        // Traitement des blocs de code
        if (line === '[CODE_BLOCK]') {
            finalizeText();
            finalizeList();
            continue;
        }

        // Traitement des listes - corriger les expressions régulières en supprimant les échappements inutiles
        const isListItem = line.match(/^[*-]\s/);
        if (isListItem) {
            finalizeText();
            listItems.push(line.substring(2));

            // Fin de liste si la prochaine ligne n'est pas une liste
            const nextLine = lines[i + 1]?.trim();
            if (isLastLine || !nextLine || !nextLine.match(/^[*-]\s/)) {
                finalizeList();
            }
        }
        // Traitement du texte normal
        else {
            finalizeList();

            if (line || isLastLine) {
                // Ajouter un saut de ligne si nécessaire
                currentText += (currentText && line ? '\n' : '') + line;

                if (isLastLine) {
                    finalizeText();
                }
            } else if (currentText) {
                finalizeText();
            }
        }
    }

    return parts;
});

// Formater le texte en gras
function formatBoldText(text: string): string {
    return text || '';
}

// Copier le code dans le presse-papier
function copyCode(code: string, index: number): void {
    navigator.clipboard.writeText(code);
    emit('copyCode', code);

    // Animation de confirmation
    copied.value = index;
    setTimeout(() => {
        if (copied.value === index) {
            copied.value = null;
        }
    }, 2000);
}
</script>

<style scoped>
.formatted-text {
    white-space: pre-wrap;
}
</style>

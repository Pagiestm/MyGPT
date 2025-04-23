<template>
    <div class="text-gray-800 w-full">
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
                        class="formatted-content"
                        :data-formatted-text="formatText(item)"
                    ></span>
                </li>
            </ul>

            <!-- Texte normal -->
            <p v-else class="whitespace-pre-wrap break-words leading-relaxed">
                <span
                    class="formatted-content"
                    :data-formatted-text="formatText(part.text || '')"
                ></span>
            </p>
        </div>

        <!-- Blocs de code -->
        <CodeBlock
            v-for="(block, index) in codeBlocks"
            :key="`code-${index}`"
            :block="block"
            :is-mobile="isMobile"
            :initially-collapsed="isMobile"
            @copy="onCopyCode"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import CodeBlock from './CodeBlock.vue';

// Types
interface FormattedPart {
    type: 'text' | 'list';
    text?: string;
    items?: string[];
}

interface CodeBlockData {
    language: string;
    code: string;
}

// Props & Emits
const props = defineProps<{
    content: string;
    isFromAi: boolean;
}>();

const emit = defineEmits(['copyCode']);

// État
const isMobile = ref(window.innerWidth < 768);

// Regex pour les blocs de code
const CODE_BLOCK_REGEX = /```([a-zA-Z]*)\n([\s\S]*?)```/g;

// Lifecycle hooks
onMounted(() => {
    renderFormattedContent();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// Fonction pour rendre le contenu formaté
function renderFormattedContent() {
    const elements = document.querySelectorAll('.formatted-content');
    elements.forEach((element) => {
        if (element instanceof HTMLElement) {
            element.innerHTML = element.dataset.formattedText || '';
        }
    });
}

// Gérer le redimensionnement de la fenêtre
function handleResize() {
    isMobile.value = window.innerWidth < 768;
}

// Extraire les blocs de code du contenu
const codeBlocks = computed<CodeBlockData[]>(() => {
    const blocks: CodeBlockData[] = [];
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

// Traiter le contenu pour obtenir des parties formatées
const formattedParts = computed<FormattedPart[]>(() => {
    const parts: FormattedPart[] = [];
    const lines = contentWithoutCode.value.split('\n');

    let currentText = '';
    let listItems: string[] = [];

    function addText() {
        if (currentText) {
            parts.push({ type: 'text', text: currentText });
            currentText = '';
        }
    }

    function addList() {
        if (listItems.length > 0) {
            parts.push({ type: 'list', items: [...listItems] });
            listItems = [];
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isLastLine = i === lines.length - 1;

        // Cas du bloc de code
        if (line === '[CODE_BLOCK]') {
            addText();
            addList();
            continue;
        }

        // Cas de liste à puces
        if (line.match(/^[*-]\s/)) {
            addText();
            listItems.push(line.substring(2));

            const nextLine = lines[i + 1]?.trim();
            if (isLastLine || !nextLine || !nextLine.match(/^[*-]\s/)) {
                addList();
            }
        }
        // Cas de texte normal
        else {
            addList();

            if (line || isLastLine) {
                currentText += (currentText && line ? '\n' : '') + line;
                if (isLastLine) addText();
            } else if (currentText) {
                addText();
            }
        }
    }

    return parts;
});

// Formater le texte (gras et code inline)
function formatText(text: string): string {
    if (!text) return '';

    // Sécuriser le HTML
    let result = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Formater le texte en gras
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Formater le code inline
    return result.replace(/`([^`]+)`/g, (_match, code) => {
        const wrappedCode = code.replace(/([/._-])/g, '$1<wbr>');
        return `<code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-sm break-all md:break-normal">${wrappedCode}</code>`;
    });
}

// Gérer la copie du code
function onCopyCode(code: string) {
    emit('copyCode', code);
}
</script>

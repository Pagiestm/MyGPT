<template>
    <div>
        <div
            v-for="[date, group] in groupedConversations"
            :key="date"
            class="mb-4"
        >
            <!-- Titre du groupe -->
            <h3 class="text-xs font-semibold text-gray-500 mb-2 px-2">
                {{ date }}
            </h3>

            <!-- Conversations du groupe -->
            <div
                v-for="conversation in group"
                :key="conversation.id"
                class="py-2.5 px-3 rounded-lg cursor-pointer transition-all flex justify-between items-center relative mb-2"
                :class="{
                    'bg-indigo-100 text-indigo-500':
                        activeId === conversation.id,
                    'hover:bg-gray-100': activeId !== conversation.id
                }"
            >
                <!-- Titre de la conversation -->
                <div
                    class="flex-1 font-medium overflow-hidden"
                    @click="$emit('select', conversation.id)"
                >
                    <span
                        class="block truncate max-w-[180px] sm:max-w-[200px] md:max-w-full"
                        >{{ conversation.name }}</span
                    >
                </div>

                <!-- Menu contextuel -->
                <div class="relative">
                    <button
                        class="p-1.5 ml-2 text-gray-400 hover:text-indigo-500 transition-colors rounded-full"
                        title="Options"
                        @click.stop="$emit('toggle-menu', conversation.id)"
                    >
                        <i class="fas fa-ellipsis-v"></i>
                    </button>

                    <!-- Options du menu -->
                    <div
                        v-if="openMenuId === conversation.id"
                        class="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg py-1 w-40 z-10"
                    >
                        <button
                            class="w-full text-left px-4 py-2 flex items-center text-red-500 hover:bg-gray-100"
                            @click.stop="$emit('delete', conversation.id)"
                        >
                            <i class="fas fa-trash-alt mr-2"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Conversation } from '../../../interfaces/conversation.interface';

const props = defineProps<{
    conversations: Conversation[];
    activeId: string | null;
    openMenuId: string | null;
}>();

defineEmits<{
    (e: 'select', id: string): void;
    (e: 'toggle-menu', id: string): void;
    (e: 'delete', id: string): void;
}>();

function formatDateGroup(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    if (isSameDay(date, today)) return 'Aujourd’hui';
    if (isSameDay(date, yesterday)) return 'Hier';

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

const groupedConversations = computed(() => {
    const groups: Record<string, Conversation[]> = {};

    props.conversations.forEach((conv) => {
        const dateKey = formatDateGroup(conv.createdAt);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(conv);
    });

    // Tri des groupes par date décroissante
    return Object.entries(groups)
        .map(
            ([date, convs]) =>
                [
                    date,
                    convs.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
                ] as [string, Conversation[]]
        )
        .sort((a, b) => {
            const d1 = new Date(a[1][0].createdAt).getTime();
            const d2 = new Date(b[1][0].createdAt).getTime();
            return d2 - d1;
        });
});
</script>

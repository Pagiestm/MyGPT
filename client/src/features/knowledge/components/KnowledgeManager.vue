<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UFormField label="Portée" class="w-full sm:w-64">
        <USelect
          v-model="folderId"
          :items="folderItems"
          value-key="value"
          placeholder="Tout le compte"
          class="w-full"
        />
      </UFormField>

      <UButton
        icon="i-lucide-upload"
        :loading="isUploading"
        class="self-end"
        @click="picker?.click()"
      >
        Ajouter un document
      </UButton>
      <input
        ref="picker"
        type="file"
        class="hidden"
        :accept="ACCEPTED_DOCUMENTS"
        @change="onPick"
      />
    </div>

    <p class="text-xs text-muted">
      Texte, Markdown, CSV, JSON, XML, YAML ou HTML, 2 Mo maximum. Les documents sans dossier
      s'appliquent à toutes vos conversations.
    </p>

    <UInput
      v-model="keyword"
      icon="i-lucide-search"
      placeholder="Chercher un passage dans vos documents"
      class="w-full"
      :loading="searching"
      aria-label="Chercher dans la base de connaissances"
    />

    <ul
      v-if="matches?.length"
      class="divide-y divide-default rounded-(--radius-panel) border border-default"
    >
      <li v-for="(match, index) in matches" :key="index" class="flex flex-col gap-1 px-3 py-2">
        <span class="flex items-baseline justify-between gap-2">
          <span class="truncate text-xs font-medium text-highlighted">{{ match.name }}</span>
          <span class="shrink-0 text-xs text-dimmed">{{ Math.round(match.score * 100) }} %</span>
        </span>
        <p class="text-sm text-pretty text-muted">{{ match.content }}</p>
      </li>
    </ul>
    <p v-else-if="searched && !searching" class="text-sm text-muted">
      Aucun passage ne correspond à cette recherche.
    </p>

    <USkeleton v-if="isLoading" class="h-20 w-full" />
    <p v-else-if="!documents?.length" class="text-sm text-muted">
      Aucun document indexé pour cette portée.
    </p>

    <ul v-else class="divide-y divide-default rounded-(--radius-panel) border border-default">
      <li
        v-for="document in documents"
        :key="document.id"
        class="flex min-w-0 items-center gap-3 px-3 py-2"
      >
        <UIcon name="i-lucide-file-text" class="size-4 shrink-0 text-dimmed" />
        <span class="flex min-w-0 flex-col">
          <span class="text-sm font-medium break-all text-highlighted">{{ document.name }}</span>
          <span class="text-xs text-muted">
            {{ formatSize(document.size) }} · {{ document.chunkCount }} extraits ·
            {{ folderName(document.folderId) }}
          </span>
        </span>
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="xs"
          class="ml-auto"
          :aria-label="`Supprimer ${document.name}`"
          @click="remove(document.id)"
        />
      </li>
    </ul>
    <BaseLoadMore :has-more="hasMore" :loading="loadingMore" @more="loadMore()" />
  </div>
</template>

<script setup lang="ts">
import BaseLoadMore from '@/shared/ui/BaseLoadMore.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UIcon from '@nuxt/ui/components/Icon.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import USelect from '@nuxt/ui/components/Select.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, ref, useTemplateRef } from 'vue';
import { ACCEPTED_DOCUMENTS, MAX_DOCUMENT_SIZE, MIN_SEARCH_LENGTH, formatSize } from '../types';
import { getErrorMessage } from '@/shared/lib/http';
import { useFolders } from '@/features/folders';
import {
  useDeleteDocument,
  useDocuments,
  useKnowledgeSearch,
  useUploadDocument,
} from '../composables/useKnowledge';

const toast = useToast();
const picker = useTemplateRef<HTMLInputElement>('picker');
const folderId = ref<string | undefined>();

const { data: folders } = useFolders();
const { items: documents, isLoading, hasMore, loadMore, loadingMore } = useDocuments(folderId);
const { mutateAsync: upload, isLoading: isUploading } = useUploadDocument();
const { mutateAsync: deleteDocument } = useDeleteDocument();

const keyword = ref('');
const { data: matches, isLoading: searching } = useKnowledgeSearch(keyword, folderId);
const searched = computed(() => keyword.value.trim().length >= MIN_SEARCH_LENGTH);

const folderItems = computed(() => [
  { value: undefined, label: 'Tout le compte' },
  ...(folders.value ?? []).map((folder) => ({ value: folder.id, label: folder.name })),
]);

function folderName(id: string | null) {
  if (!id) return 'tout le compte';
  return folders.value?.find((folder) => folder.id === id)?.name ?? 'dossier supprimé';
}

async function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (file.size > MAX_DOCUMENT_SIZE) {
    toast.add({ title: 'Le document dépasse 2 Mo', color: 'error' });
    return;
  }

  try {
    const document = await upload({ file, folderId: folderId.value });
    toast.add({
      title: `« ${document.name} » indexé en ${document.chunkCount} extraits`,
      color: 'success',
    });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, "L'indexation a échoué"), color: 'error' });
  }
}

async function remove(id: string) {
  try {
    await deleteDocument(id);
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Suppression impossible'), color: 'error' });
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="folder ? 'Modifier le dossier' : 'Nouveau dossier'"
    description="Les consignes s'appliquent à toutes les conversations du dossier, en plus des vôtres."
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        id="folder-form"
        :schema="folderSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField label="Nom" name="name">
          <UInput v-model="state.name" autofocus placeholder="Cours de JavaScript" class="w-full" />
        </UFormField>
        <UFormField
          label="Consignes pour l'IA"
          name="instructions"
          help="Facultatif. Exemple : « Explique comme à un étudiant de première année. »"
        >
          <UTextarea v-model="state.instructions" :rows="4" autoresize class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Annuler"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          form="folder-form"
          :loading="isLoading"
          :label="folder ? 'Enregistrer' : 'Créer le dossier'"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import UModal from '@nuxt/ui/components/Modal.vue';
import UTextarea from '@nuxt/ui/components/Textarea.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, watch } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui';
import { folderSchema, type Folder, type FolderInput } from '../types';
import { getErrorMessage } from '@/shared/lib/http';
import { useSaveFolder } from '../composables/useFolders';

const props = defineProps<{ open: boolean; folder: Folder | null }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const toast = useToast();
const { mutateAsync: saveFolder, isLoading } = useSaveFolder();
const state = reactive<FolderInput>({ name: '', instructions: '' });

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    state.name = props.folder?.name ?? '';
    state.instructions = props.folder?.instructions ?? '';
  },
  { immediate: true },
);

async function onSubmit(event: FormSubmitEvent<FolderInput>) {
  try {
    await saveFolder({ id: props.folder?.id, input: event.data });
    toast.add({ title: props.folder ? 'Dossier enregistré' : 'Dossier créé', color: 'success' });
    emit('update:open', false);
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, "Le dossier n'a pas pu être enregistré"),
      color: 'error',
    });
  }
}
</script>

<template>
  <div
    class="relative"
    @dragover.prevent="dragging = true"
    @dragleave.self="dragging = false"
    @drop.prevent="onDrop"
  >
    <ModelDownloadBanner />

    <UChatPrompt
      v-model="text"
      :placeholder="listening ? 'Je vous écoute…' : placeholder"
      variant="outline"
      color="neutral"
      :autofocus="autofocus"
      :disabled="disabled"
      @submit="submit"
      @paste="onPaste"
    >
      <template v-if="files.length" #header>
        <ul class="flex flex-wrap gap-2 pb-1" aria-label="Fichiers joints">
          <li v-for="file in files" :key="file.key">
            <FileChip
              :name="file.name"
              :mime-type="file.type"
              :preview="file.preview"
              :detail="file.status === 'uploading' ? 'Envoi…' : formatSize(file.size)"
            >
              <template #action>
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="file.status === 'uploading'"
                  :aria-label="`Retirer ${file.name}`"
                  @click="remove(file.key)"
                />
              </template>
            </FileChip>
          </li>
        </ul>
      </template>

      <template #footer>
        <div class="flex min-w-0 items-center gap-1">
          <input
            ref="picker"
            type="file"
            multiple
            :accept="ACCEPTED_FILES"
            class="hidden"
            @change="onPick"
          />
          <UTooltip text="Joindre des fichiers">
            <UButton
              icon="i-lucide-paperclip"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Joindre des fichiers"
              :disabled="files.length >= MAX_ATTACHMENTS"
              @click="picker?.click()"
            />
          </UTooltip>
          <ModelPicker v-model="model" />
        </div>

        <div class="flex items-center gap-1">
          <UTooltip
            v-if="speech.isSupported.value"
            :text="listening ? 'Arrêter la dictée' : 'Dicter'"
          >
            <UButton
              :icon="listening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
              :color="listening ? 'error' : 'neutral'"
              :variant="listening ? 'soft' : 'ghost'"
              size="sm"
              :aria-label="listening ? 'Arrêter la dictée' : 'Dicter le message'"
              :aria-pressed="listening"
              @click="toggleDictation"
            />
          </UTooltip>
          <UChatPromptSubmit
            :status="status"
            :disabled="!busy && !canSend"
            :aria-label="busy ? 'Arrêter la génération' : 'Envoyer le message'"
            @stop="emit('stop')"
          />
        </div>
      </template>
    </UChatPrompt>

    <div
      v-if="dragging"
      class="pointer-events-none absolute inset-0 grid place-items-center rounded-field border-2 border-dashed border-accented bg-default/90 text-sm text-muted"
    >
      Déposez vos fichiers ici
    </div>
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import UChatPrompt from '@nuxt/ui/components/ChatPrompt.vue';
import UChatPromptSubmit from '@nuxt/ui/components/ChatPromptSubmit.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useSpeechRecognition } from '@vueuse/core';
import {
  ACCEPTED_FILES,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS,
  formatSize,
  type Attachment,
} from '@/domain/attachment';
import { getErrorMessage } from '@/infrastructure/http/client';
import { attachmentRepository } from '@/infrastructure/repositories/attachment.repository';
import FileChip from '@/presentation/components/common/FileChip.vue';
import ModelPicker from './ModelPicker.vue';
import ModelDownloadBanner from './ModelDownloadBanner.vue';

const props = withDefaults(
  defineProps<{
    phase?: 'idle' | 'submitted' | 'streaming';
    placeholder?: string;
    autofocus?: boolean;
    disabled?: boolean;
  }>(),
  { phase: 'idle', placeholder: 'Écrivez votre message...', autofocus: true, disabled: false },
);

const emit = defineEmits<{
  submit: [payload: { content: string; attachments: Attachment[]; model?: string }];
  stop: [];
}>();

const text = defineModel<string>({ default: '' });
const model = defineModel<string | undefined>('model');

interface PendingFile {
  key: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: 'uploading' | 'ready';
  attachment?: Attachment;
  controller: AbortController;
}

const toast = useToast();
const picker = useTemplateRef<HTMLInputElement>('picker');
const files = ref<PendingFile[]>([]);
const dragging = ref(false);

const busy = computed(() => props.phase !== 'idle');
const status = computed(() => (props.phase === 'idle' ? 'ready' : props.phase));
const uploading = computed(() => files.value.some((file) => file.status === 'uploading'));
const canSend = computed(() => text.value.trim().length > 0 && !uploading.value);

async function add(list: FileList | File[]) {
  for (const file of Array.from(list)) {
    if (files.value.length >= MAX_ATTACHMENTS) {
      toast.add({ title: `${MAX_ATTACHMENTS} fichiers maximum par message`, color: 'warning' });
      break;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.add({ title: `« ${file.name} » dépasse 10 Mo`, color: 'error' });
      continue;
    }
    const entry: PendingFile = {
      key: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'uploading',
      controller: new AbortController(),
    };
    files.value.push(entry);
    try {
      const attachment = await attachmentRepository.upload(file, entry.controller.signal);
      const target = files.value.find((item) => item.key === entry.key);
      if (target) Object.assign(target, { status: 'ready', attachment });
    } catch (error) {
      if (entry.controller.signal.aborted) continue;
      remove(entry.key);
      toast.add({
        title: getErrorMessage(error, `« ${file.name} » n'a pas pu être envoyé`),
        color: 'error',
      });
    }
  }
}

function remove(key: string) {
  const file = files.value.find((item) => item.key === key);
  if (!file) return;
  file.controller.abort();
  if (file.preview) URL.revokeObjectURL(file.preview);
  files.value = files.value.filter((item) => item.key !== key);
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) add(input.files);
  input.value = '';
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  if (event.dataTransfer?.files.length) add(event.dataTransfer.files);
}

function onPaste(event: ClipboardEvent) {
  const pasted = Array.from(event.clipboardData?.files ?? []);
  if (pasted.length) {
    event.preventDefault();
    add(pasted);
  }
}

function submit() {
  if (busy.value || !canSend.value) return;
  const attachments = files.value.flatMap((file) => (file.attachment ? [file.attachment] : []));
  emit('submit', { content: text.value.trim(), attachments, model: model.value });
  text.value = '';
  files.value.forEach((file) => file.preview && URL.revokeObjectURL(file.preview));
  files.value = [];
  if (listening.value) speech.stop();
}

const speech = useSpeechRecognition({ lang: 'fr-FR', continuous: true, interimResults: false });
const listening = speech.isListening;
let base = '';

function toggleDictation() {
  if (listening.value) {
    speech.stop();
    return;
  }
  base = text.value ? `${text.value.trimEnd()} ` : '';
  speech.start();
}

watch(speech.result, (heard) => {
  if (listening.value && heard) text.value = base + heard;
});

watch(speech.error, (error) => {
  if (!error) return;
  toast.add({
    title:
      'error' in error && error.error === 'not-allowed'
        ? 'Autorisez le micro dans votre navigateur pour dicter'
        : 'La dictée a été interrompue',
    color: 'warning',
  });
});

onBeforeUnmount(() => {
  files.value.forEach((file) => {
    file.controller.abort();
    if (file.preview) URL.revokeObjectURL(file.preview);
  });
});
</script>

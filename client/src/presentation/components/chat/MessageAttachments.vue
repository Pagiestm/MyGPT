<template>
  <ul class="flex flex-wrap justify-end gap-2" aria-label="Fichiers joints">
    <li v-for="file in attachments" :key="file.id">
      <a
        :href="attachmentRepository.url(file.id)"
        target="_blank"
        rel="noopener"
        :title="file.name"
        class="block transition-opacity hover:opacity-90"
      >
        <img
          v-if="isImage(file)"
          :src="attachmentRepository.url(file.id)"
          :alt="file.name"
          loading="lazy"
          class="max-h-48 max-w-64 rounded-card border border-default object-cover"
        />
        <FileChip
          v-else
          :name="file.name"
          :mime-type="file.mimeType"
          :detail="formatSize(file.size)"
        />
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import FileChip from '@/presentation/components/common/FileChip.vue';
import { formatSize, isImage, type Attachment } from '@/domain/attachment';
import { attachmentRepository } from '@/infrastructure/repositories/attachment.repository';

defineProps<{ attachments: Attachment[] }>();
</script>

<template>
  <div class="flex flex-col gap-3">
    <UAlert
      v-if="!supported"
      color="neutral"
      variant="subtle"
      title="Ce navigateur ne gère pas WebGPU"
      description="Essayez Chrome, Edge, Safari 26+ ou Firefox récent pour exécuter un modèle sans rien installer."
    />

    <template v-else>
      <p class="text-sm text-muted">
        Ces modèles s'exécutent dans cet onglet, sur votre machine. Aucune installation, aucune
        donnée envoyée, aucun abonnement. Les poids sont téléchargés une fois puis conservés en
        cache.
      </p>

      <ModelDownloadBanner />

      <USkeleton v-if="isLoading" class="h-32 w-full" />

      <ul v-else class="divide-y divide-default rounded-(--radius-panel) border border-default">
        <li v-for="item in webgpuModels" :key="item.id" class="flex items-center gap-3 px-3 py-2">
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-medium text-highlighted">{{ item.label }}</span>
            <span class="text-xs text-muted">
              {{ item.description }} · {{ formatVram(item.vramMb) }} ·
              {{ item.downloaded ? 'déjà téléchargé' : 'à télécharger' }}
            </span>
          </span>
          <UButton
            v-if="item.downloaded"
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            class="ml-auto shrink-0"
            :aria-label="`Supprimer ${item.label} du cache`"
            @click="remove(item.id, item.label)"
          />
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import { computed } from 'vue';
import { formatVram } from '@/domain/webgpu';
import { getErrorMessage } from '@/infrastructure/http/client';
import { useDownloadedModels } from '@/application/composables/useModels';
import {
  isWebgpuSupported,
  webllmRepository,
} from '@/infrastructure/repositories/webllm.repository';
import ModelDownloadBanner from '@/presentation/components/chat/ModelDownloadBanner.vue';

const toast = useToast();
const supported = isWebgpuSupported();
const { data, isLoading, refresh } = useDownloadedModels();

const webgpuModels = computed(() => data.value ?? []);

async function remove(id: string, label: string) {
  try {
    await webllmRepository.remove(id);
    await refresh();
    toast.add({ title: `« ${label} » a été retiré du cache`, color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Suppression impossible'), color: 'error' });
  }
}
</script>

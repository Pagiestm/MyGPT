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

      <p v-if="device" class="text-xs text-dimmed">Votre appareil : {{ device }}</p>

      <ModelDownloadBanner />

      <USkeleton v-if="isLoading" class="h-32 w-full" />

      <ul v-else class="divide-y divide-default rounded-(--radius-panel) border border-default">
        <li
          v-for="item in webgpuModels"
          :key="item.id"
          class="flex min-w-0 flex-col gap-2 px-3 py-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-medium text-highlighted">{{ item.label }}</span>
              <span class="text-xs text-muted">
                {{ item.downloaded ? 'déjà téléchargé' : 'à télécharger' }}
              </span>
            </span>
            <UButton
              :icon="opened === item.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              color="neutral"
              variant="ghost"
              size="xs"
              class="ml-auto shrink-0"
              :aria-expanded="opened === item.id"
              :aria-label="`Capacités de ${item.label}`"
              @click="opened = opened === item.id ? null : item.id"
            />
            <UButton
              v-if="item.downloaded"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              class="shrink-0"
              :aria-label="`Supprimer ${item.label} du cache`"
              @click="remove(item.id, item.label)"
            />
          </div>

          <ModelProfile v-if="opened === item.id" :model="item" />
          <p v-else class="text-xs text-balance text-muted">
            {{ item.description }} · {{ formatVram(item.vramMb) }}
            <template v-if="item.strengths.length"> · {{ item.strengths.join(' · ') }}</template>
          </p>
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
import { computed, ref } from 'vue';
import { formatVram } from '../types/webgpu';
import { getErrorMessage } from '@/shared/lib/http';
import { useDownloadedModels } from '../composables/useModels';
import { useGpuCapabilities } from '../composables/useGpuCapabilities';
import { isWebgpuSupported, webllm } from '../api/webllm';
import ModelDownloadBanner from '../components/ModelDownloadBanner.vue';
import ModelProfile from '../components/ModelProfile.vue';

const toast = useToast();
const supported = isWebgpuSupported();
const { data, isLoading, refresh } = useDownloadedModels();

const { profile } = useGpuCapabilities();

const device = computed(() => {
  const found = profile.value;
  if (!found) return null;
  const parts = [
    found.handheld ? 'appareil tactile' : 'poste de travail',
    found.features.has('shader-f16') ? 'f16 pris en charge' : 'sans f16',
    `tampons ${formatVram(found.maxBufferSize / (1024 * 1024))}`,
  ];
  if (found.memoryGb !== null) parts.push(`mémoire annoncée ${found.memoryGb} Go`);
  return parts.join(' · ');
});

const webgpuModels = computed(() => data.value ?? []);
const opened = ref<string | null>(null);

async function remove(id: string, label: string) {
  try {
    await webllm.remove(id);
    await refresh();
    toast.add({ title: `« ${label} » a été retiré du cache`, color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Suppression impossible'), color: 'error' });
  }
}
</script>

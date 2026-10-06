<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-muted">
      Le catalogue proposé aux utilisateurs. Il est stocké en base : vos modifications prennent
      effet immédiatement, sans redéploiement.
    </p>

    <USkeleton v-if="isLoading" class="h-32 w-full" />

    <ul v-else class="divide-y divide-default rounded-(--radius-panel) border border-default">
      <li v-for="item in models" :key="item.id" class="flex items-center gap-3 px-3 py-2">
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-medium text-highlighted">
            {{ item.label }}
            <UBadge v-if="!item.enabled" color="neutral" variant="subtle" size="sm">masqué</UBadge>
          </span>
          <span class="truncate text-xs text-muted">
            {{ item.description }} · {{ formatVram(item.vramMb) }} · révision {{ item.revision }}
          </span>
          <span class="truncate font-mono text-xs text-dimmed">{{ item.id }}</span>
        </span>

        <div class="ml-auto flex shrink-0 items-center gap-1">
          <UTooltip text="Forcer le retéléchargement chez tous les utilisateurs">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="`Rafraîchir les poids de ${item.label}`"
              @click="refresh(item.id, item.label)"
            />
          </UTooltip>
          <UTooltip :text="item.enabled ? 'Masquer du sélecteur' : 'Afficher dans le sélecteur'">
            <UButton
              :icon="item.enabled ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="`${item.enabled ? 'Masquer' : 'Afficher'} ${item.label}`"
              @click="toggle(item)"
            />
          </UTooltip>
          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="`Retirer ${item.label}`"
            @click="remove(item.id)"
          />
        </div>
      </li>
    </ul>

    <UForm :state="draft" class="flex flex-wrap items-end gap-3" @submit="add">
      <UFormField label="Modèle MLC" class="min-w-72 flex-1">
        <USelectMenu
          v-model="draft.id"
          :items="candidates"
          value-key="value"
          :loading="!candidates.length"
          placeholder="Choisir dans le catalogue de WebLLM"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Nom affiché" class="w-48">
        <UInput v-model="draft.label" placeholder="Llama 3.2 3B" />
      </UFormField>
      <UFormField label="Description" class="w-56">
        <UInput v-model="draft.description" placeholder="Bon compromis" />
      </UFormField>
      <UButton type="submit" :loading="isSaving" :disabled="!draft.id || !draft.label">
        Ajouter
      </UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue';
import UButton from '@nuxt/ui/components/Button.vue';
import UForm from '@nuxt/ui/components/Form.vue';
import UFormField from '@nuxt/ui/components/FormField.vue';
import UInput from '@nuxt/ui/components/Input.vue';
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import UTooltip from '@nuxt/ui/components/Tooltip.vue';
import { useToast } from '@nuxt/ui/composables';
import { reactive, ref, watchEffect } from 'vue';
import type { AiModel } from '@/features/models';
import { formatVram } from '@/features/models';
import { getErrorMessage } from '@/shared/lib/http';
import { webllm } from '@/features/models';
import {
  useAllModels,
  useDeleteModel,
  useRefreshModelWeights,
  useSaveModel,
} from '@/features/models';

const toast = useToast();
const { data: models, isLoading } = useAllModels();
const { mutateAsync: save, isLoading: isSaving } = useSaveModel();
const { mutateAsync: refreshWeights } = useRefreshModelWeights();
const { mutateAsync: deleteModel } = useDeleteModel();

const draft = reactive({ id: '', label: '', description: '' });

const candidates = ref<{ value: string; label: string }[]>([]);
watchEffect(async () => {
  const installed = new Set((models.value ?? []).map((item) => item.id));
  candidates.value = (await webllm.availableModelIds()).filter(
    (item) => !installed.has(item.value),
  );
});

async function add() {
  const vramMb = await webllm.vramFor(draft.id);
  try {
    await save({
      input: {
        id: draft.id,
        label: draft.label.trim(),
        description: draft.description.trim() || 'Modèle exécuté dans le navigateur',
        vramMb,
      },
    });
    Object.assign(draft, { id: '', label: '', description: '' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, "L'ajout a échoué"), color: 'error' });
  }
}

async function toggle(item: AiModel) {
  try {
    await save({ id: item.id, input: { ...item, enabled: !item.enabled } });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Modification impossible'), color: 'error' });
  }
}

async function refresh(id: string, label: string) {
  try {
    await refreshWeights(id);
    toast.add({
      title: `« ${label} » sera retéléchargé chez chaque utilisateur`,
      color: 'success',
    });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Rafraîchissement impossible'), color: 'error' });
  }
}

async function remove(id: string) {
  try {
    await deleteModel(id);
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Suppression impossible'), color: 'error' });
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="font-medium text-highlighted">Supprimer mon compte</p>
      <p class="text-sm text-muted">
        Vos conversations et vos messages seront définitivement effacés.
      </p>
    </div>
    <UButton color="error" variant="subtle" @click="open = true">Supprimer le compte</UButton>

    <BaseConfirmModal
      v-model:open="open"
      title="Supprimer votre compte ?"
      description="Cette action est irréversible. Toutes vos données seront supprimées."
      confirm-label="Supprimer définitivement"
      :loading="isLoading"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue';
import { useToast } from '@nuxt/ui/composables';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseConfirmModal from '@/shared/ui/BaseConfirmModal.vue';
import { useDeleteAccount } from '@/features/account/composables/useAccount';

const router = useRouter();
const toast = useToast();
const { mutateAsync: deleteAccount, isLoading } = useDeleteAccount();

const open = ref(false);

async function onConfirm() {
  try {
    await deleteAccount();
    toast.add({ title: 'Votre compte a été supprimé', color: 'success' });
    await router.push({ name: 'home' });
  } catch {
    toast.add({ title: 'La suppression du compte a échoué', color: 'error' });
  } finally {
    open.value = false;
  }
}
</script>

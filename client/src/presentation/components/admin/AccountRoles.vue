<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-muted">
      Les administrateurs gèrent le catalogue de modèles et les rôles. Tout le reste -
      conversations, documents - appartient à chaque compte, quel que soit son rôle.
    </p>

    <USkeleton v-if="isLoading" class="h-24 w-full" />

    <ul v-else class="divide-y divide-default rounded-(--radius-panel) border border-default">
      <li v-for="account in accounts" :key="account.id" class="flex items-center gap-3 px-3 py-2">
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-medium text-highlighted">{{ account.pseudo }}</span>
          <span class="truncate text-xs text-muted">{{ account.email }}</span>
        </span>
        <USelect
          :model-value="account.role"
          :items="roleItems"
          value-key="value"
          size="sm"
          class="ml-auto w-36 shrink-0"
          :aria-label="`Rôle de ${account.pseudo}`"
          @update:model-value="(role) => change(account, role as UserRole)"
        />
      </li>
    </ul>

    <LoadMore :has-more="hasMore" :loading="loadingMore" @more="loadMore()" />
  </div>
</template>

<script setup lang="ts">
import USelect from '@nuxt/ui/components/Select.vue';
import LoadMore from '@/presentation/components/common/LoadMore.vue';
import USkeleton from '@nuxt/ui/components/Skeleton.vue';
import { useToast } from '@nuxt/ui/composables';
import type { AccountSummary, UserRole } from '@/domain/user';
import { getErrorMessage } from '@/infrastructure/http/client';
import { useAccounts, useUpdateRole } from '@/application/composables/useAccounts';

const toast = useToast();
const { items: accounts, isLoading, hasMore, loadMore, loadingMore } = useAccounts();
const { mutateAsync: updateRole } = useUpdateRole();

const roleItems = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'admin', label: 'Administrateur' },
];

async function change(account: AccountSummary, role: UserRole) {
  if (role === account.role) return;
  try {
    await updateRole({ id: account.id, role });
    toast.add({ title: `« ${account.pseudo} » est désormais ${role}`, color: 'success' });
  } catch (error) {
    toast.add({ title: getErrorMessage(error, 'Changement de rôle impossible'), color: 'error' });
  }
}
</script>

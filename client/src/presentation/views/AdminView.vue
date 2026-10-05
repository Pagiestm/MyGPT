<template>
  <UDashboardPanel id="admin">
    <template #header>
      <UDashboardNavbar title="Administration" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-8 py-6 sm:max-w-3xl">
        <UPageCard
          title="Comptes et rôles"
          description="Qui peut administrer l'instance. Le reste - conversations, documents - appartient à chaque compte."
          variant="subtle"
        >
          <AccountRoles />
        </UPageCard>

        <UPageCard
          title="Catalogue des modèles"
          description="Ce que tous les utilisateurs voient dans le sélecteur, et la révision de leurs poids."
          variant="subtle"
        >
          <ModelCatalog />
        </UPageCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UPageCard from '@nuxt/ui/components/PageCard.vue';
import AccountRoles from '@/presentation/components/admin/AccountRoles.vue';
import ModelCatalog from '@/presentation/components/admin/ModelCatalog.vue';
</script>

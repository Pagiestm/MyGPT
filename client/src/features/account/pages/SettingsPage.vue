<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Réglages" />
    </template>

    <template #body>
      <UContainer class="flex flex-col gap-8 py-6 sm:max-w-2xl">
        <UPageCard
          title="Profil"
          description="Votre pseudo est visible sur les conversations que vous partagez."
          variant="subtle"
        >
          <ProfileForm />
        </UPageCard>

        <UPageCard
          title="Personnalisation"
          description="Adaptez les réponses de l'assistant à vos besoins."
          variant="subtle"
        >
          <PreferencesForm />
        </UPageCard>

        <UPageCard
          title="Modèles"
          description="Tout tourne dans votre navigateur : aucune installation, aucun abonnement, aucune donnée envoyée."
          variant="subtle"
        >
          <BrowserModels />
        </UPageCard>

        <UPageCard
          title="Base de connaissances"
          description="Vos documents sont découpés et consultés par l'assistant avant de répondre, qu'il tourne en ligne ou sur votre machine."
          variant="subtle"
        >
          <KnowledgeManager />
        </UPageCard>

        <UPageCard
          title="Apparence"
          description="Choisissez le thème de l'interface."
          variant="subtle"
        >
          <UColorModeSelect class="w-48" />
        </UPageCard>

        <UPageCard title="Zone de danger" variant="subtle">
          <DeleteAccount />
        </UPageCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import UColorModeSelect from '@nuxt/ui/runtime/vue/components/color-mode/ColorModeSelect.vue';
import UContainer from '@nuxt/ui/components/Container.vue';
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue';
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue';
import UPageCard from '@nuxt/ui/components/PageCard.vue';
import ProfileForm from '@/features/account/components/ProfileForm.vue';
import PreferencesForm from '@/features/account/components/PreferencesForm.vue';
import DeleteAccount from '@/features/account/components/DeleteAccount.vue';
import { KnowledgeManager } from '@/features/knowledge';
import { BrowserModels } from '@/features/models';
</script>

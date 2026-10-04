import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';

export default defineConfig({
  plugins: [
    vue(),
    // Composants et composables Nuxt UI importés explicitement dans chaque fichier
    ui({
      ui: { colors: { primary: 'cobalt', neutral: 'stone' } },
      autoImport: false,
      components: false,
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Pré-optimisées pour éviter un rechargement complet au premier accès au chat en dev
  optimizeDeps: { include: ['markstream-vue', 'shiki', 'zod'] },
  // .env unique à la racine du monorepo (seules les variables VITE_* sont exposées au navigateur)
  envDir: '..',
  server: {
    // Polling requis pour le hot-reload dans Docker sur un volume Windows/macOS
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
  },
});

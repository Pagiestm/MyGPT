import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // .env unique à la racine du monorepo (seules les variables VITE_* sont exposées au navigateur)
  envDir: '..',
  server: {
    // Polling requis pour le hot-reload dans Docker sur un volume Windows/macOS
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
  },
});

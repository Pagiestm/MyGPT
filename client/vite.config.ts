import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';
import { uiConfig } from './ui.config';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

// Le navigateur n'appelle que /api : Vite transmet à l'API en développement, le middleware
// le fait sur Vercel. L'adresse réelle de l'API vient de API_URL, jamais du bundle.
// (En auto-hébergement, VITE_API_URL porte l'adresse complète de l'API et ce proxy ne sert pas.)
const apiProxy = (apiUrl: string) => ({
  '/api': { target: apiUrl, changeOrigin: true, rewrite: (path: string) => path.slice(4) },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '');
  const apiUrl = env.API_URL || `http://localhost:${env.PORT || 3000}`;

  return {
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [
      vue(),
      // Composants et composables Nuxt UI importés explicitement dans chaque fichier
      ui({
        ui: uiConfig,
        autoImport: false,
        components: false,
        // Icônes Lucide repérées dans le code et embarquées dans le build (aucun appel au CDN Iconify)
        icon: { clientBundle: { scan: { globInclude: ['src/**/*.{vue,ts}'], globExclude: [] } } },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // Pré-optimisées pour éviter un rechargement complet au premier accès au chat en dev
    optimizeDeps: { include: ['markstream-vue', 'shiki', 'zod'] },
    // .env unique à la racine du monorepo (seules les variables VITE_* sont exposées au navigateur)
    envDir: '..',
    test: { include: ['src/**/*.spec.ts'], environment: 'node' },
    server: {
      // Polling requis pour le hot-reload dans Docker sur un volume Windows/macOS
      watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
      proxy: apiProxy(apiUrl),
    },
    preview: { proxy: apiProxy(apiUrl) },
  };
});

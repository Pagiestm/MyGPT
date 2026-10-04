import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    'client/playwright-report/',
    'client/test-results/',
    'client/blob-report/',
    'client/tests-examples/',
  ]),

  // Base commune
  js.configs.recommended,
  tseslint.configs.recommended,

  // Fichiers de config / scripts Node (racine, vite, playwright...)
  {
    files: ['*.{js,mjs,cjs,ts}', '*/*.config.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  // ---------- Client (Vue 3) ----------
  {
    files: ['client/**/*.{js,ts,vue}'],
    extends: [pluginVue.configs['flat/recommended']],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },

  // ---------- Server (NestJS, règles typées) ----------
  {
    files: ['server/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname + '/server',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    files: ['server/**/*.spec.ts', 'server/test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },

  // Prettier en dernier pour désactiver les règles de style conflictuelles
  prettierRecommended,
);

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FAKE_LLM?: string;
}

declare const __APP_VERSION__: string;

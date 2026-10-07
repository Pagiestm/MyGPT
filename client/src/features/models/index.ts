export { default as BrowserModels } from './components/BrowserModels.vue';
export { default as ModelDownloadBanner } from './components/ModelDownloadBanner.vue';
export { default as ModelPicker } from './components/ModelPicker.vue';
export { useGpuCapabilities } from './composables/useGpuCapabilities';
export { useModelDownload } from './composables/useModelDownload';
export {
  useAllModels,
  useDeleteModel,
  useDownloadedModels,
  useModels,
  useRefreshModelWeights,
  useSaveModel,
} from './composables/useModels';
export {
  cancelModelDownload,
  isWebgpuSupported,
  ModelDownloadCancelledError,
  ModelUnsupportedError,
  onModelDownload,
  webllm,
  WebgpuUnavailableError,
  type LibraryFacts,
  type PromptMessage,
} from './api/webllm';
export { canRun, runnableModels, type DeviceProfile } from './lib/compatibility';
export type { AiModel, AiModels, AiProvider, ModelCatalog } from './types/ai';
export {
  BROWSER_MODEL_PREFIX,
  featureLabel,
  formatContextWindow,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  formatVram,
  isBrowserModel,
  toWebllmId,
  withBrowserPrefix,
  type ModelDownload,
} from './types/webgpu';
export { default as ModelProfile } from './components/ModelProfile.vue';

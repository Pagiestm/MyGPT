export const BROWSER_MODEL_PREFIX = 'webgpu:';

export function isBrowserModel(model?: string | null): boolean {
  return !!model && model.startsWith(BROWSER_MODEL_PREFIX);
}

export function toWebllmId(model: string): string {
  return model.slice(BROWSER_MODEL_PREFIX.length);
}

export function withBrowserPrefix(id: string): string {
  return isBrowserModel(id) ? id : `${BROWSER_MODEL_PREFIX}${id}`;
}

export const EMBEDDING_MODEL = 'snowflake-arctic-embed-m-q0f32-MLC-b4';

export const EMBEDDING_DIMENSIONS = 768;

export interface ModelDownload {
  modelId: string;
  progress: number;
  text: string;
}

export function formatVram(megabytes: number) {
  return megabytes < 1024 ? `${Math.round(megabytes)} Mo` : `${(megabytes / 1024).toFixed(1)} Go`;
}

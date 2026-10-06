import { onScopeDispose, ref } from 'vue';
import type { ModelDownload } from '../types/webgpu';
import { onModelDownload } from '../api/webllm';

export function useModelDownload() {
  const download = ref<ModelDownload | null>(null);
  const stop = onModelDownload((value) => (download.value = value));
  onScopeDispose(stop);
  return { download };
}

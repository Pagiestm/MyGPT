import { onScopeDispose, ref } from 'vue';
import type { ModelDownload } from '@/domain/webgpu';
import { onModelDownload } from '@/infrastructure/repositories/webllm.repository';

export function useModelDownload() {
  const download = ref<ModelDownload | null>(null);
  const stop = onModelDownload((value) => (download.value = value));
  onScopeDispose(stop);
  return { download };
}

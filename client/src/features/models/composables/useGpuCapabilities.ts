import { computed, readonly, ref } from 'vue';
import type { AiModel } from '../types/ai';
import { recommendModel, type DeviceProfile } from '../lib/recommend';

const profile = ref<DeviceProfile | null>(null);
let probe: Promise<void> | null = null;

function reportedMemory(): number | null {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === 'number' && memory > 0 ? memory : null;
}

async function detect(): Promise<void> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return;

  const adapter = await navigator.gpu.requestAdapter().catch(() => null);
  profile.value = {
    features: new Set(adapter ? [...adapter.features] : []),
    maxBufferSize: adapter?.limits.maxBufferSize ?? 0,
    memoryGb: reportedMemory(),
  };
}

export function useGpuCapabilities() {
  probe ??= detect();

  function missingFor(model: Pick<AiModel, 'requiredFeatures'>): string[] {
    const device = profile.value;
    if (!device) return [];
    return model.requiredFeatures.filter((feature) => !device.features.has(feature));
  }

  function recommend(models: AiModel[]): string | undefined {
    return recommendModel(models, profile.value);
  }

  return {
    profile: readonly(profile),
    detected: computed(() => profile.value !== null),
    missingFor,
    recommend,
  };
}

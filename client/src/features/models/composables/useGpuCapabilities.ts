import { computed, readonly, ref } from 'vue';
import type { AiModel } from '../types/ai';
import { canRun, runnableModels, type DeviceProfile } from '../lib/compatibility';

const profile = ref<DeviceProfile | null>(null);
let probe: Promise<void> | null = null;

function reportedMemory(): number | null {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === 'number' && memory > 0 ? memory : null;
}

async function detect(): Promise<void> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return;

  const adapter = await navigator.gpu.requestAdapter().catch(() => null);
  if (!adapter) return;

  profile.value = {
    features: new Set(adapter.features),
    maxBufferSize: adapter.limits.maxBufferSize,
    memoryGb: reportedMemory(),
    handheld: window.matchMedia('(pointer: coarse)').matches,
  };
}

export function useGpuCapabilities() {
  probe ??= detect();

  function missingFor(model: Pick<AiModel, 'requiredFeatures'>): string[] {
    const device = profile.value;
    if (!device) return [];
    return model.requiredFeatures.filter((feature) => !device.features.has(feature));
  }

  function runnable(models: AiModel[]): AiModel[] {
    return runnableModels(models, profile.value);
  }

  function supports(model: AiModel): boolean {
    return canRun(model, profile.value);
  }

  return {
    profile: readonly(profile),
    detected: computed(() => profile.value !== null),
    missingFor,
    runnable,
    supports,
  };
}

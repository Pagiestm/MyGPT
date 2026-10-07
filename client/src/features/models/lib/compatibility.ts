import type { AiModel } from '../types/ai';

export interface DeviceProfile {
  features: Set<string>;
  maxBufferSize: number;
  memoryGb: number | null;
}

const COMFORTABLE_BUFFER = 1 << 30;

const MEMORY_SHARE = 0.5;

const REPORTED_MEMORY_CAP_GB = 8;

const MODEST_CEILING_MB = 640;

function memoryBudget(device: DeviceProfile): number | null {
  if (device.memoryGb === null || device.memoryGb >= REPORTED_MEMORY_CAP_GB) return null;
  return device.memoryGb * 1024 * MEMORY_SHARE;
}

export function isModest(device: DeviceProfile): boolean {
  return device.maxBufferSize < COMFORTABLE_BUFFER;
}

function ceiling(device: DeviceProfile): number | null {
  const budget = memoryBudget(device);
  if (!isModest(device)) return budget;
  return budget === null ? MODEST_CEILING_MB : Math.min(budget, MODEST_CEILING_MB);
}

export function canRun(model: AiModel, device: DeviceProfile | null): boolean {
  if (!device) return true;

  if (!model.requiredFeatures.every((feature) => device.features.has(feature))) return false;
  if (isModest(device) && !model.lowResource) return false;

  const limit = ceiling(device);
  return limit === null || model.vramMb <= limit;
}

export function runnableModels(models: AiModel[], device: DeviceProfile | null): AiModel[] {
  return models.filter((model) => canRun(model, device));
}

import type { AiModel } from '../types/ai';

export interface DeviceProfile {
  features: Set<string>;
  maxBufferSize: number;
  memoryGb: number | null;
}

const COMFORTABLE_BUFFER = 1 << 30;

const MEMORY_SHARE = 0.5;

const REPORTED_MEMORY_CAP_GB = 8;

function memoryBudget(device: DeviceProfile): number | null {
  if (device.memoryGb === null || device.memoryGb >= REPORTED_MEMORY_CAP_GB) return null;
  return device.memoryGb * 1024 * MEMORY_SHARE;
}

function heaviest(models: AiModel[]): AiModel {
  return models.reduce((best, model) => (model.vramMb > best.vramMb ? model : best));
}

function lightest(models: AiModel[]): AiModel {
  return models.reduce((best, model) => (model.vramMb < best.vramMb ? model : best));
}

export function recommendModel(
  models: AiModel[],
  device: DeviceProfile | null,
): string | undefined {
  if (!device || !models.length) return undefined;

  const runnable = models.filter((model) =>
    model.requiredFeatures.every((feature) => device.features.has(feature)),
  );
  if (!runnable.length) return undefined;

  const modest = device.maxBufferSize < COMFORTABLE_BUFFER;
  const frugal = modest ? runnable.filter((model) => model.lowResource) : runnable;
  const candidates = frugal.length ? frugal : runnable;

  const budget = memoryBudget(device);
  if (budget === null) return (modest ? lightest(candidates) : heaviest(candidates)).id;

  const fitting = candidates.filter((model) => model.vramMb <= budget);
  return (fitting.length ? heaviest(fitting) : lightest(candidates)).id;
}

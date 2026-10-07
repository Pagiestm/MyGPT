import { describe, expect, it } from 'vitest';
import type { AiModel } from '../types/ai';
import { canRun, runnableModels, type DeviceProfile } from './compatibility';

const GO = 2 ** 30;
const MO = 2 ** 20;

function model(
  id: string,
  vramMb: number,
  lowResource: boolean,
  requiredFeatures: string[] = [],
): AiModel {
  return {
    id,
    label: id,
    description: '',
    vramMb,
    position: 0,
    enabled: true,
    revision: 1,
    parameters: null,
    strengths: [],
    limitations: [],
    contextWindow: null,
    lowResource,
    requiredFeatures,
  };
}

const catalogue = [
  model('smol-135m', 360, true, ['shader-f16']),
  model('smol-360m', 580, true),
  model('tiny-1b', 675, true, ['shader-f16']),
  model('llama-1b', 1128, true),
  model('llama-8b', 5295, false),
];

function device(partial: Partial<DeviceProfile>): DeviceProfile {
  return {
    features: new Set(['shader-f16']),
    maxBufferSize: 4 * GO,
    memoryGb: null,
    handheld: false,
    ...partial,
  };
}

describe('canRun', () => {
  const machine = catalogue.find((model) => model.id === 'llama-8b')!;
  const frugal = catalogue.find((model) => model.id === 'llama-1b')!;
  const exigeant = catalogue.find((model) => model.id === 'smol-135m')!;
  const leger = catalogue.find((model) => model.id === 'smol-360m')!;

  it('accepte tout tant que le GPU est inconnu', () => {
    expect(canRun(machine, null)).toBe(true);
  });

  it('refuse un modèle dont le GPU ne gère pas les fonctionnalités', () => {
    expect(canRun(exigeant, device({ features: new Set() }))).toBe(false);
  });

  it('refuse un modèle gourmand quand les tampons GPU sont étroits', () => {
    expect(canRun(machine, device({ maxBufferSize: 512 * MO }))).toBe(false);
    expect(canRun(leger, device({ maxBufferSize: 512 * MO }))).toBe(true);
  });

  it('refuse un modèle plus lourd que la mémoire annoncée', () => {
    expect(canRun(frugal, device({ memoryGb: 1 }))).toBe(false);
    expect(canRun(frugal, device({ memoryGb: 4 }))).toBe(true);
  });

  it('ne se laisse pas brider par le plafond de navigator.deviceMemory', () => {
    expect(canRun(machine, device({ memoryGb: 8 }))).toBe(true);
    expect(canRun(machine, device({ memoryGb: null }))).toBe(true);
  });

  it('plafonne un téléphone qui accorde pile le gigaoctet demandé', () => {
    const telephone = device({ maxBufferSize: 1 * GO, memoryGb: null, handheld: true });
    expect(canRun(frugal, telephone)).toBe(false);
    expect(canRun(leger, telephone)).toBe(true);
  });

  it('plafonne un appareil tactile même sans mémoire annoncée ni tampons étroits', () => {
    expect(canRun(frugal, device({ handheld: true }))).toBe(false);
    expect(canRun(frugal, device({ handheld: false }))).toBe(true);
  });

  it('plafonne un appareil étroit même quand il annonce la mémoire maximale', () => {
    const telephone = device({ maxBufferSize: 256 * MO, memoryGb: 8 });
    expect(canRun(frugal, telephone)).toBe(false);
    expect(canRun(leger, telephone)).toBe(true);
  });
});

describe('runnableModels', () => {
  it("ne garde que ce qu'un téléphone peut exécuter", () => {
    const telephone = device({
      features: new Set(),
      maxBufferSize: 256 * MO,
      memoryGb: 4,
    });
    expect(runnableModels(catalogue, telephone).map((model) => model.id)).toEqual(['smol-360m']);
  });

  it('rend tout le catalogue sur une machine confortable', () => {
    expect(runnableModels(catalogue, device({ memoryGb: 8 }))).toHaveLength(catalogue.length);
  });

  it('peut ne rien rendre si aucun modèle ne tourne', () => {
    const impossible = [model('f16-only', 400, true, ['shader-f16'])];
    expect(runnableModels(impossible, device({ features: new Set() }))).toEqual([]);
  });
});

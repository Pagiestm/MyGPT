import { describe, expect, it } from 'vitest';
import type { AiModel } from '../types/ai';
import { recommendModel, type DeviceProfile } from './recommend';

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
  return { features: new Set(['shader-f16']), maxBufferSize: 4 * GO, memoryGb: null, ...partial };
}

describe('recommendModel', () => {
  it('prend le modèle le plus capable sur une machine confortable', () => {
    expect(recommendModel(catalogue, device({ memoryGb: 8 }))).toBe('llama-8b');
  });

  it('ne se laisse pas brider par le plafond de navigator.deviceMemory', () => {
    const plafonne = recommendModel(catalogue, device({ memoryGb: 8 }));
    const inconnu = recommendModel(catalogue, device({ memoryGb: null }));
    expect(plafonne).toBe(inconnu);
  });

  it('se limite aux modèles frugaux quand les tampons GPU sont étroits', () => {
    const choisi = recommendModel(catalogue, device({ maxBufferSize: 512 * MO, memoryGb: 4 }));
    expect(choisi).toBe('llama-1b');
  });

  it('écarte les modèles dont le GPU ne gère pas les fonctionnalités', () => {
    const choisi = recommendModel(
      catalogue,
      device({ features: new Set(), maxBufferSize: 256 * MO, memoryGb: 4 }),
    );
    expect(choisi).toBe('llama-1b');
  });

  it('retombe sur le plus léger quand rien ne tient dans la mémoire annoncée', () => {
    const choisi = recommendModel(
      catalogue,
      device({ features: new Set(), maxBufferSize: 256 * MO, memoryGb: 1 }),
    );
    expect(choisi).toBe('smol-360m');
  });

  it('reste prudent sur un appareil étroit qui ne déclare pas sa mémoire', () => {
    const choisi = recommendModel(catalogue, device({ maxBufferSize: 256 * MO }));
    expect(choisi).toBe('smol-135m');
  });

  it('ne recommande rien sans adaptateur GPU', () => {
    expect(recommendModel(catalogue, null)).toBeUndefined();
  });

  it('ne recommande rien si aucun modèle ne tourne sur ce GPU', () => {
    const impossible = [model('f16-only', 400, true, ['shader-f16'])];
    expect(recommendModel(impossible, device({ features: new Set() }))).toBeUndefined();
  });
});

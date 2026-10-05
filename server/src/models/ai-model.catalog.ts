export interface SeedModel {
  id: string;
  label: string;
  description: string;
  vramMb: number;
}

export const SEED_MODELS: SeedModel[] = [
  {
    id: 'webgpu:Qwen3.5-0.8B-q4f16_1-MLC',
    label: 'Qwen 3.5 0.8B',
    description: 'Le plus léger',
    vramMb: 1629,
  },
  {
    id: 'webgpu:gemma-2-2b-it-q4f16_1-MLC',
    label: 'Gemma 2 2B',
    description: 'Léger, multilingue',
    vramMb: 1895,
  },
  {
    id: 'webgpu:Qwen3.5-2B-q4f16_1-MLC',
    label: 'Qwen 3.5 2B',
    description: 'Rapide et récent',
    vramMb: 2245,
  },
  {
    id: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B',
    description: 'Bon compromis',
    vramMb: 2264,
  },
  {
    id: 'webgpu:Qwen3-4B-q4f16_1-MLC',
    label: 'Qwen 3 4B',
    description: 'Raisonnement',
    vramMb: 3432,
  },
  {
    id: 'webgpu:Phi-4-mini-instruct-q4f16_1-MLC',
    label: 'Phi-4 mini',
    description: 'Concis',
    vramMb: 3438,
  },
  {
    id: 'webgpu:Llama-3.1-8B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.1 8B',
    description: 'Le plus capable',
    vramMb: 5001,
  },
  {
    id: 'webgpu:Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 Coder 7B',
    description: 'Spécialisé code',
    vramMb: 5107,
  },
];

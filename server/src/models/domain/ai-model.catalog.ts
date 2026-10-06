export interface SeedModel {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  parameters: string;
  strengths: string[];
  limitations: string[];
  contextWindow: number;
  lowResource: boolean;
  requiredFeatures: string[];
}

export const SEED_MODELS: SeedModel[] = [
  {
    id: 'webgpu:Qwen3.5-0.8B-q4f16_1-MLC',
    label: 'Qwen 3.5 0.8B',
    description: 'Le plus léger',
    vramMb: 1629,
    parameters: '0,8 milliard',
    strengths: ['Démarre très vite', 'Tient sur un GPU modeste', 'Réponses courtes et directes'],
    limitations: ['Raisonnement limité', 'Se trompe sur les questions complexes'],
    contextWindow: 4096,
    lowResource: true,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:gemma-2-2b-it-q4f16_1-MLC',
    label: 'Gemma 2 2B',
    description: 'Léger, multilingue',
    vramMb: 1895,
    parameters: '2 milliards',
    strengths: ['À l’aise en français', 'Multilingue', 'Écriture naturelle'],
    limitations: ['Peu à l’aise avec le code', 'Demande un GPU compatible f16'],
    contextWindow: 4096,
    lowResource: false,
    requiredFeatures: ['shader-f16'],
  },
  {
    id: 'webgpu:Qwen3.5-2B-q4f16_1-MLC',
    label: 'Qwen 3.5 2B',
    description: 'Rapide et récent',
    vramMb: 2245,
    parameters: '2 milliards',
    strengths: ['Rapide', 'Génération récente', 'Bon rapport qualité / mémoire'],
    limitations: ['Raisonnement limité sur les sujets techniques'],
    contextWindow: 4096,
    lowResource: false,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B',
    description: 'Bon compromis',
    vramMb: 2264,
    parameters: '3 milliards',
    strengths: [
      'Bon compromis qualité / vitesse',
      'Suit bien les consignes',
      'GPU modeste suffisant',
    ],
    limitations: ['Moins précis que les modèles de 7 milliards et plus'],
    contextWindow: 4096,
    lowResource: true,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Qwen3-4B-q4f16_1-MLC',
    label: 'Qwen 3 4B',
    description: 'Raisonnement',
    vramMb: 3432,
    parameters: '4 milliards',
    strengths: ['Raisonne étape par étape', 'Mathématiques', 'À l’aise en français'],
    limitations: ['Réponses plus lentes', 'Parfois verbeux'],
    contextWindow: 4096,
    lowResource: true,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Phi-4-mini-instruct-q4f16_1-MLC',
    label: 'Phi-4 mini',
    description: 'Concis',
    vramMb: 3438,
    parameters: '3,8 milliards',
    strengths: ['Réponses concises', 'Raisonnement solide pour sa taille', 'Mathématiques'],
    limitations: ['Surtout entraîné en anglais', 'Culture générale limitée'],
    contextWindow: 4096,
    lowResource: false,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Llama-3.1-8B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.1 8B',
    description: 'Le plus capable',
    vramMb: 5001,
    parameters: '8 milliards',
    strengths: ['Le plus capable du catalogue', 'Réponses nuancées', 'Bonne culture générale'],
    limitations: [
      'Demande 5 Go de mémoire graphique',
      'Premier chargement long',
      'Génération plus lente',
    ],
    contextWindow: 4096,
    lowResource: false,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 Coder 7B',
    description: 'Spécialisé code',
    vramMb: 5107,
    parameters: '7 milliards',
    strengths: ['Spécialisé code', 'Nombreux langages', 'Explique et corrige du code'],
    limitations: ['Moins bon hors programmation', 'Demande 5 Go de mémoire graphique'],
    contextWindow: 4096,
    lowResource: false,
    requiredFeatures: [],
  },
];

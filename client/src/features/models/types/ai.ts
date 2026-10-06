export type AiProvider = 'browser';

export interface AiModel {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  position: number;
  enabled: boolean;
  revision: number;
  /** Rédigé par un administrateur */
  parameters: string | null;
  strengths: string[];
  limitations: string[];
  /** Annoncé par WebLLM */
  contextWindow: number | null;
  lowResource: boolean;
  requiredFeatures: string[];
  downloaded?: boolean;
}

export interface AiModels {
  models: AiModel[];
  defaultModel: string;
}

export interface ModelCatalog {
  models: AiModel[];
  canManage: boolean;
}

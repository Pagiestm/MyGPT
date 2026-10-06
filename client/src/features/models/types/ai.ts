export type AiProvider = 'browser';

export interface AiModel {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  position: number;
  enabled: boolean;
  revision: number;
  parameters: string | null;
  strengths: string[];
  limitations: string[];
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

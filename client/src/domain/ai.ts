export type AiProvider = 'browser';

export interface AiModel {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  position: number;
  enabled: boolean;
  revision: number;
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

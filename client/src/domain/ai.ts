export interface AiModel {
  id: string;
  label: string;
  description: string;
}

export interface AiModels {
  models: AiModel[];
  defaultModel: string;
}

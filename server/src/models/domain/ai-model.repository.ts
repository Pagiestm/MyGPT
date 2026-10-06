import type { AiModel } from './ai-model';

export const AI_MODEL_REPOSITORY = Symbol('AiModelRepository');

export interface AiModelRepository {
  findById(id: string): Promise<AiModel | null>;
  findEnabled(): Promise<AiModel[]>;
  findAll(): Promise<AiModel[]>;
  count(): Promise<number>;
  save(model: AiModel): Promise<AiModel>;
  saveMany(models: AiModel[]): Promise<void>;
  remove(id: string): Promise<void>;
}

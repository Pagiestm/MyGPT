import { http } from '@/shared/lib/http';
import type { AiModel, ModelCatalog } from '../types/ai';

export interface ModelInput {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  position?: number;
  enabled?: boolean;
}

export const modelsApi = {
  list: () => http.get<ModelCatalog>('/models').then((r) => r.data),

  all: () => http.get<AiModel[]>('/models/all').then((r) => r.data),

  create: (input: ModelInput) => http.post<AiModel>('/models', input).then((r) => r.data),

  update: (id: string, changes: Partial<ModelInput> & { refreshWeights?: boolean }) =>
    http.patch<AiModel>(`/models/${encodeURIComponent(id)}`, changes).then((r) => r.data),

  remove: (id: string) => http.delete(`/models/${encodeURIComponent(id)}`).then((r) => r.data),
};

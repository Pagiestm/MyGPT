import { http } from '../http/client';
import type { KnowledgeDocument } from '@/domain/knowledge';
import { PAGE_SIZE, type Page } from '@/domain/pagination';
import { webllmRepository } from './webllm.repository';
import { EMBEDDING_MODEL } from '@/domain/webgpu';

interface SplitDocument {
  name: string;
  mimeType: string;
  size: number;
  chunks: string[];
}

export const knowledgeRepository = {
  list: (folderId?: string, offset = 0, limit = PAGE_SIZE) =>
    http
      .get<Page<KnowledgeDocument>>('/knowledge', {
        params: { ...(folderId ? { folderId } : {}), offset, limit },
      })
      .then((r) => r.data),

  async upload(file: File, folderId?: string) {
    const form = new FormData();
    form.append('file', file);
    const split = await http.post<SplitDocument>('/knowledge/chunks', form).then((r) => r.data);

    const vectors = await webllmRepository.embed(split.chunks);

    return http
      .post<KnowledgeDocument>('/knowledge', {
        name: split.name,
        mimeType: split.mimeType,
        size: split.size,
        embeddingModel: EMBEDDING_MODEL,
        folderId,
        chunks: split.chunks.map((content, index) => ({ content, embedding: vectors[index]! })),
      })
      .then((r) => r.data);
  },

  remove: (id: string) => http.delete(`/knowledge/${id}`).then((r) => r.data),
};

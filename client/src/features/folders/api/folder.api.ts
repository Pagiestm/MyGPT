import { http } from '@/shared/lib/http';
import type { Folder, FolderInput } from '../types';

export const folderApi = {
  list: () => http.get<Folder[]>('/folders').then((r) => r.data),
  create: (input: FolderInput) => http.post<Folder>('/folders', input).then((r) => r.data),
  update: (id: string, input: Partial<FolderInput>) =>
    http.patch<Folder>(`/folders/${id}`, input).then((r) => r.data),
  remove: (id: string) => http.delete(`/folders/${id}`),
};

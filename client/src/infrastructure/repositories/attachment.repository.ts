import { apiUrl, http } from '../http/client';
import type { Attachment } from '@/domain/attachment';

export const attachmentRepository = {
  upload: (file: File, signal?: AbortSignal) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<Attachment>('/attachments', form, { signal }).then((r) => r.data);
  },
  url: (id: string) => apiUrl(`/attachments/${id}`),
};

import { apiUrl, http } from '@/shared/lib/http';
import type { Attachment } from '@/features/chat/types/attachment';

export const attachmentApi = {
  upload: (file: File, signal?: AbortSignal) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<Attachment>('/attachments', form, { signal }).then((r) => r.data);
  },
  url: (id: string) => apiUrl(`/attachments/${id}`),
};

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

export const ACCEPTED_FILES =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,text/*,.md,.csv,.json,.xml,.yml,.yaml,.js,.jsx,.ts,.tsx,.vue,.py,.java,.kt,.c,.h,.cpp,.cs,.go,.rs,.rb,.php,.swift,.sql,.sh,.html,.css,.scss';

export function isImage(attachment: Pick<Attachment, 'mimeType'>) {
  return attachment.mimeType.startsWith('image/');
}

export function fileIcon(mimeType: string) {
  return mimeType === 'application/pdf' ? 'i-lucide-file-text' : 'i-lucide-file-code';
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

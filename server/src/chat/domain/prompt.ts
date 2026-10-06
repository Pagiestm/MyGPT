export interface AiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AiAttachment {
  name: string;
  mimeType: string;
  data: Buffer;
}

export const BROWSER_MODEL_PREFIX = 'webgpu:';

export function isBrowserModel(model?: string | null): boolean {
  return !!model && model.startsWith(BROWSER_MODEL_PREFIX);
}

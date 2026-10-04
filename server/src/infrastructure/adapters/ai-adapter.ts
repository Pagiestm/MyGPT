export interface AiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AiAttachment {
  name: string;
  mimeType: string;
  data: Buffer;
}

export interface AiRequest {
  prompt: string;
  history?: AiTurn[];
  attachments?: AiAttachment[];
  model?: string;
  systemInstruction?: string;
  signal?: AbortSignal;
}

export interface AiModel {
  id: string;
  label: string;
  description: string;
}

export interface IAiAdapter {
  readonly models: AiModel[];
  readonly defaultModel: string;
  resolveModel(model?: string | null): string;
  streamResponse(request: AiRequest): AsyncGenerator<string>;
  generateTitle(question: string, answer: string): Promise<string | null>;
}

export const AI_ADAPTER = 'IAiAdapter';

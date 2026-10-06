export interface KnowledgeDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  embeddingModel: string;
  folderId: string | null;
  createdAt: string;
}

export const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024;

export const ACCEPTED_DOCUMENTS =
  '.pdf,.txt,.md,.markdown,.csv,.tsv,.json,.xml,.yaml,.yml,.html,.htm,.rst,.log,.ini,.toml,.sql';

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
}

export const MIN_SEARCH_LENGTH = 3;

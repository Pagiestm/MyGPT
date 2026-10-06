export const queryKeys = {
  authProviders: ['auth', 'providers'] as const,
  knowledgeSearch: (keyword: string, folderId?: string) =>
    ['knowledge', 'search', folderId ?? 'tout', keyword] as const,
  conversations: ['conversations'] as const,
  archived: ['conversations', 'archived'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  messageSearch: (conversationId: string, keyword: string) =>
    ['messages', conversationId, 'search', keyword] as const,
  globalSearch: (keyword: string) => ['search', keyword] as const,
  folders: ['folders'] as const,
  accounts: ['accounts'] as const,
  models: ['models'] as const,
  allModels: ['models', 'all'] as const,
  downloadedModels: ['models', 'downloaded'] as const,
  knowledgeRoot: ['knowledge'] as const,
  knowledge: (folderId?: string) => ['knowledge', folderId ?? 'all'] as const,
  saved: ['saved'] as const,
  shared: (link: string) => ['shared', link] as const,
};

export const queryKeys = {
  conversations: ['conversations'] as const,
  archived: ['conversations', 'archived'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  messageSearch: (conversationId: string, keyword: string) =>
    ['messages', conversationId, 'search', keyword] as const,
  globalSearch: (keyword: string) => ['search', keyword] as const,
  folders: ['folders'] as const,
  models: ['models'] as const,
  saved: ['saved'] as const,
  shared: (link: string) => ['shared', link] as const,
};

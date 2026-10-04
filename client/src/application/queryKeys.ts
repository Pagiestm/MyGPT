export const queryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  messageSearch: (conversationId: string, keyword: string) =>
    ['messages', conversationId, 'search', keyword] as const,
  saved: ['saved'] as const,
  shared: (link: string) => ['shared', link] as const,
};

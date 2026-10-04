export interface Message {
  id: string;
  content: string;
  conversationId: string;
  isFromAi: boolean;
  createdAt: string;
  updatedAt: string;
}

export function sortByDate(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

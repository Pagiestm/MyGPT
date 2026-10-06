export const CONVERSATION_TRANSCRIPT = Symbol('ConversationTranscript');

export interface TranscriptEntry {
  id: string;
  content: string;
  isFromAi: boolean;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationTranscript {
  read(conversationId: string): Promise<TranscriptEntry[]>;
  copy(fromConversationId: string, toConversationId: string): Promise<void>;
}

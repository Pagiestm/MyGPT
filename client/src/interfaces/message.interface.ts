export interface Message {
    id: string;
    content: string;
    conversationId: string;
    isFromAi: boolean;
    createdAt: string;
    updatedAt: string;
}

import { Message } from './message.interface';

export interface Conversation {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    shareLink?: string;
    shareExpiresAt?: string;
}

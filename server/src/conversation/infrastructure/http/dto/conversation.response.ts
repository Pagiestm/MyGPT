import { ApiProperty } from '@nestjs/swagger';
import type { Conversation } from '../../../domain/conversation';
import type { TranscriptEntry } from '../../../domain/conversation-transcript';

export class ConversationResponse {
  @ApiProperty({ example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a' })
  id: string;

  @ApiProperty({ example: 'Comment fonctionne NestJS ?' })
  name: string;

  @ApiProperty({ example: 'c1f1e1e2-1234-4fd5-a4e2-bb123456789a' })
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  sharedFrom: string | null;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ required: false, nullable: true, example: 'abc123xyz456' })
  shareLink: string | null;

  @ApiProperty({ required: false, nullable: true })
  shareExpiresAt: Date | null;

  @ApiProperty({ example: false })
  pinned: boolean;

  @ApiProperty({ example: false })
  archived: boolean;

  @ApiProperty({ example: false })
  titleLocked: boolean;

  @ApiProperty({ required: false, nullable: true })
  folderId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(conversation: Conversation): ConversationResponse {
    return {
      id: conversation.id,
      name: conversation.name,
      userId: conversation.userId,
      sharedFrom: conversation.sharedFrom,
      isPublic: conversation.isPublic,
      shareLink: conversation.shareLink,
      shareExpiresAt: conversation.shareExpiresAt,
      pinned: conversation.pinned,
      archived: conversation.archived,
      titleLocked: conversation.titleLocked,
      folderId: conversation.folderId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}

export class SharedConversationResponse extends ConversationResponse {
  @ApiProperty({ description: 'Messages de la conversation partagée' })
  messages: Array<{
    id: string;
    conversationId: string;
    content: string;
    isFromAi: boolean;
    model: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;

  @ApiProperty({ description: 'Auteur du partage' })
  user: { pseudo: string };

  static fromShared(
    conversation: Conversation,
    messages: TranscriptEntry[],
    ownerPseudo: string,
  ): SharedConversationResponse {
    return {
      ...ConversationResponse.from(conversation),
      messages: messages.map((entry) => ({
        ...entry,
        conversationId: conversation.id,
      })),
      user: { pseudo: ownerPseudo },
    };
  }
}

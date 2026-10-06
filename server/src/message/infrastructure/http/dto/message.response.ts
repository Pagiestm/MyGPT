import { ApiProperty } from '@nestjs/swagger';
import { AttachmentResponse } from '../../../../attachment/infrastructure/http/dto/attachment.response';
import type { Message } from '../../../domain/message';
import type { MessageHit } from '../../../domain/message.repository';

export class MessageResponse {
  @ApiProperty({ example: 'e5f6g7h8-9abc-4def-ghij-kl123456789b' })
  id: string;

  @ApiProperty({ example: 'a2b3c4d5-5678-4abc-bdef-ff123456789a' })
  conversationId: string;

  @ApiProperty({ example: 'Comment puis-je créer un contrôleur dans NestJS ?' })
  content: string;

  @ApiProperty({ description: "Indique si le message provient de l'IA", example: false })
  isFromAi: boolean;

  @ApiProperty({ required: false, nullable: true, example: 'webgpu:Qwen3.5-2B-q4f16_1-MLC' })
  model: string | null;

  @ApiProperty({ type: () => [AttachmentResponse] })
  attachments: AttachmentResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(message: Message): MessageResponse {
    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      isFromAi: message.isFromAi,
      model: message.model,
      attachments: message.attachments.map((attachment) => ({ ...attachment })),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export class MessageHitResponse extends MessageResponse {
  @ApiProperty({ description: 'Conversation contenant le message' })
  conversation: { id: string; name: string };

  static fromHit(hit: MessageHit): MessageHitResponse {
    return {
      ...MessageResponse.from(hit.message),
      conversation: { id: hit.message.conversationId, name: hit.conversationName },
    };
  }
}

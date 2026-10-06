import { Module } from '@nestjs/common';
import { AttachmentModule } from '../attachment/attachment.module';
import { ConversationModule } from '../conversation/conversation.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import {
  BuildExchangeContext,
  PrepareEdit,
  PrepareRegenerate,
  PrepareSend,
  SaveReply,
  SaveTitle,
} from './application/chat.use-cases';
import { BuildPrompt } from './application/prompt.builder';
import { ChatController } from './infrastructure/http/chat.controller';

@Module({
  imports: [MessageModule, ConversationModule, UserModule, AttachmentModule, KnowledgeModule],
  controllers: [ChatController],
  providers: [
    PrepareSend,
    PrepareRegenerate,
    PrepareEdit,
    BuildExchangeContext,
    BuildPrompt,
    SaveReply,
    SaveTitle,
  ],
})
export class ChatModule {}

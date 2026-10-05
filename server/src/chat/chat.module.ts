import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User]),
    AttachmentModule,
    KnowledgeModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, PromptService],
})
export class ChatModule {}

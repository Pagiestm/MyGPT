import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../user/entities/user.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User]),
    AttachmentModule,
    InfrastructureModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

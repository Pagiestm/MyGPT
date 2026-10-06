import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationModule } from '../conversation/conversation.module';
import { MESSAGE_REPOSITORY } from './domain/message.repository';
import {
  GetMessage,
  ListMessages,
  SearchInConversation,
  SearchUserMessages,
} from './application/message.use-cases';
import { MessageOrm } from './infrastructure/persistence/message.orm-entity';
import { TypeormMessageRepository } from './infrastructure/persistence/typeorm-message.repository';
import { MessageController } from './infrastructure/http/message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MessageOrm]), ConversationModule],
  controllers: [MessageController],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: TypeormMessageRepository },
    ListMessages,
    SearchInConversation,
    SearchUserMessages,
    GetMessage,
  ],
  exports: [MESSAGE_REPOSITORY],
})
export class MessageModule {}

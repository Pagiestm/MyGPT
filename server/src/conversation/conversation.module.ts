import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../message/entities/message.entity';
import { FolderModule } from '../folder/folder.module';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message]), FolderModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}

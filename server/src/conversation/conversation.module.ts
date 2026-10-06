import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderModule } from '../folder/folder.module';
import { MessageOrm } from '../message/infrastructure/persistence/message.orm-entity';
import { CONVERSATION_REPOSITORY } from './domain/conversation.repository';
import { CONVERSATION_TRANSCRIPT } from './domain/conversation-transcript';
import {
  DeleteConversation,
  EmptyExpiredTrash,
  ExportConversation,
  GetConversation,
  GetFolderGuidance,
  GetOwnedConversation,
  GetReadableConversation,
  ListConversations,
  ListSavedConversations,
  ListTrash,
  OpenSharedConversation,
  PurgeConversation,
  RestoreConversation,
  RevokeShare,
  SaveSharedConversation,
  SearchConversations,
  ShareConversation,
  StartConversation,
  TitleConversation,
  TouchConversation,
  UpdateConversation,
} from './application/conversation.use-cases';
import { ConversationOrm } from './infrastructure/persistence/conversation.orm-entity';
import { TypeormConversationRepository } from './infrastructure/persistence/typeorm-conversation.repository';
import { TypeormConversationTranscript } from './infrastructure/persistence/typeorm-conversation-transcript';
import { ConversationController } from './infrastructure/http/conversation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationOrm, MessageOrm]), FolderModule],
  controllers: [ConversationController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useClass: TypeormConversationRepository },
    { provide: CONVERSATION_TRANSCRIPT, useClass: TypeormConversationTranscript },
    GetConversation,
    GetOwnedConversation,
    GetReadableConversation,
    StartConversation,
    ListConversations,
    ListSavedConversations,
    SearchConversations,
    UpdateConversation,
    DeleteConversation,
    ExportConversation,
    ListTrash,
    RestoreConversation,
    PurgeConversation,
    EmptyExpiredTrash,
    ShareConversation,
    RevokeShare,
    OpenSharedConversation,
    SaveSharedConversation,
    TitleConversation,
    TouchConversation,
    GetFolderGuidance,
  ],
  exports: [
    CONVERSATION_REPOSITORY,
    GetConversation,
    GetOwnedConversation,
    GetReadableConversation,
    TitleConversation,
    TouchConversation,
    GetFolderGuidance,
  ],
})
export class ConversationModule {}

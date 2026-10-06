import { Module } from '@nestjs/common';
import { CsrfController } from './common/http/csrf.controller';
import { HealthController } from './common/http/health.controller';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { throttlers } from './app.throttlers';
import { ThrottleGuard } from './common/http/throttle.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source.options';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { ChatModule } from './chat/chat.module';
import { FolderModule } from './folder/folder.module';
import { AttachmentModule } from './attachment/attachment.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ModelsModule } from './models/models.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '../.env' }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ThrottlerModule.forRoot(throttlers),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    ConversationModule,
    MessageModule,
    ChatModule,
    FolderModule,
    AttachmentModule,
    KnowledgeModule,
    ModelsModule,
  ],
  controllers: [CsrfController, HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottleGuard }],
})
export class AppModule {}

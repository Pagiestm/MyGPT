import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KNOWLEDGE_REPOSITORY } from './domain/knowledge.repository';
import {
  ListDocuments,
  RemoveDocument,
  RetrieveContext,
  SearchDocuments,
  SplitDocumentIntoChunks,
  StoreDocument,
} from './application/knowledge.use-cases';
import { KnowledgeChunkOrm } from './infrastructure/persistence/knowledge-chunk.orm-entity';
import { KnowledgeDocumentOrm } from './infrastructure/persistence/knowledge-document.orm-entity';
import { TypeormKnowledgeRepository } from './infrastructure/persistence/typeorm-knowledge.repository';
import { KnowledgeController } from './infrastructure/http/knowledge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeDocumentOrm, KnowledgeChunkOrm])],
  controllers: [KnowledgeController],
  providers: [
    { provide: KNOWLEDGE_REPOSITORY, useClass: TypeormKnowledgeRepository },
    SplitDocumentIntoChunks,
    StoreDocument,
    ListDocuments,
    RemoveDocument,
    RetrieveContext,
    SearchDocuments,
  ],
  exports: [RetrieveContext],
})
export class KnowledgeModule {}

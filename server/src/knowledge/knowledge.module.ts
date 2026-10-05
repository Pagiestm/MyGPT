import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeChunk } from './entities/knowledge-chunk.entity';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { KnowledgeChunkRepository } from './knowledge-chunk.repository';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeDocument, KnowledgeChunk])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeChunkRepository],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}

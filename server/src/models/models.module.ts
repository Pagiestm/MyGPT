import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AI_MODEL_REPOSITORY } from './domain/ai-model.repository';
import {
  AddModel,
  GetModel,
  ListAllModels,
  ListAvailableModels,
  RemoveModel,
  SeedCatalog,
  UpdateModel,
} from './application/ai-model.use-cases';
import { AiModelOrm } from './infrastructure/persistence/ai-model.orm-entity';
import { TypeormAiModelRepository } from './infrastructure/persistence/typeorm-ai-model.repository';
import { ModelsController } from './infrastructure/http/models.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiModelOrm])],
  controllers: [ModelsController],
  providers: [
    { provide: AI_MODEL_REPOSITORY, useClass: TypeormAiModelRepository },
    SeedCatalog,
    ListAvailableModels,
    ListAllModels,
    GetModel,
    AddModel,
    UpdateModel,
    RemoveModel,
  ],
  exports: [ListAvailableModels, GetModel],
})
export class ModelsModule {}

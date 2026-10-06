import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { AiModel } from '../domain/ai-model';
import { AI_MODEL_REPOSITORY, type AiModelRepository } from '../domain/ai-model.repository';
import { SEED_MODELS } from '../domain/ai-model.catalog';

export interface AiModelInput {
  label?: string;
  description?: string;
  vramMb?: number;
  position?: number;
  enabled?: boolean;
  refreshWeights?: boolean;
}

@Injectable()
export class SeedCatalog implements OnModuleInit {
  private readonly logger = new Logger(SeedCatalog.name);

  constructor(@Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository) {}

  async onModuleInit(): Promise<void> {
    await this.execute();
  }

  async execute(): Promise<void> {
    if (await this.models.count()) return;
    await this.models.saveMany(
      SEED_MODELS.map((seed, position) => AiModel.create({ ...seed, position })),
    );
    this.logger.log(`Catalogue initialisé avec ${SEED_MODELS.length} modèles`);
  }
}

@Injectable()
export class ListAvailableModels {
  constructor(@Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository) {}

  execute(): Promise<AiModel[]> {
    return this.models.findEnabled();
  }
}

@Injectable()
export class ListAllModels {
  constructor(@Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository) {}

  execute(): Promise<AiModel[]> {
    return this.models.findAll();
  }
}

@Injectable()
export class GetModel {
  constructor(@Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository) {}

  async execute(id: string): Promise<AiModel> {
    const model = await this.models.findById(id);
    if (!model) throw new NotFoundException('Modèle introuvable');
    return model;
  }
}

@Injectable()
export class AddModel {
  constructor(@Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository) {}

  async execute(input: {
    id: string;
    label: string;
    description: string;
    vramMb: number;
    position?: number;
    enabled?: boolean;
  }): Promise<AiModel> {
    if (await this.models.findById(input.id)) {
      throw new BadRequestException('Ce modèle est déjà au catalogue');
    }
    const model = AiModel.create({
      ...input,
      position: input.position ?? (await this.models.count()),
    });
    if (input.enabled !== undefined) model.describeAs({ enabled: input.enabled });
    return this.models.save(model);
  }
}

@Injectable()
export class UpdateModel {
  constructor(
    @Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository,
    private readonly get: GetModel,
  ) {}

  async execute(id: string, input: AiModelInput): Promise<AiModel> {
    const { refreshWeights, ...changes } = input;
    const model = await this.get.execute(id);
    model.describeAs(changes);
    if (refreshWeights) model.refreshWeights();
    return this.models.save(model);
  }
}

@Injectable()
export class RemoveModel {
  constructor(
    @Inject(AI_MODEL_REPOSITORY) private readonly models: AiModelRepository,
    private readonly get: GetModel,
  ) {}

  async execute(id: string): Promise<{ id: string }> {
    const model = await this.get.execute(id);
    await this.models.remove(model.id);
    return { id: model.id };
  }
}

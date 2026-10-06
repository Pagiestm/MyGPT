import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModel } from '../../domain/ai-model';
import type { AiModelRepository } from '../../domain/ai-model.repository';
import { AiModelOrm } from './ai-model.orm-entity';

@Injectable()
export class TypeormAiModelRepository implements AiModelRepository {
  constructor(@InjectRepository(AiModelOrm) private readonly models: Repository<AiModelOrm>) {}

  async findById(id: string): Promise<AiModel | null> {
    const row = await this.models.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findEnabled(): Promise<AiModel[]> {
    const rows = await this.models.find({ where: { enabled: true }, order: { position: 'ASC' } });
    return rows.map(toDomain);
  }

  async findAll(): Promise<AiModel[]> {
    const rows = await this.models.find({ order: { position: 'ASC' } });
    return rows.map(toDomain);
  }

  count(): Promise<number> {
    return this.models.count();
  }

  async save(model: AiModel): Promise<AiModel> {
    const saved = await this.models.save(this.models.create(toOrm(model)));
    return toDomain(saved);
  }

  async saveMany(models: AiModel[]): Promise<void> {
    await this.models.save(models.map((model) => this.models.create(toOrm(model))));
  }

  async remove(id: string): Promise<void> {
    await this.models.delete(id);
  }
}

function toDomain(row: AiModelOrm): AiModel {
  return AiModel.rehydrate({
    id: row.id,
    label: row.label,
    description: row.description,
    vramMb: row.vramMb,
    position: row.position,
    enabled: row.enabled,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(model: AiModel): Partial<AiModelOrm> {
  return {
    id: model.id,
    label: model.label,
    description: model.description,
    vramMb: model.vramMb,
    position: model.position,
    enabled: model.enabled,
    revision: model.revision,
  };
}

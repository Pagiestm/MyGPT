import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModel } from './entities/ai-model.entity';
import { SEED_MODELS } from './ai-model.catalog';
import type { CreateAiModelDto, UpdateAiModelDto } from './dto/ai-model.dto';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  constructor(@InjectRepository(AiModel) private readonly models: Repository<AiModel>) {}

  async onModuleInit() {
    if (await this.models.count()) return;
    await this.models.save(
      SEED_MODELS.map((seed, position) => this.models.create({ ...seed, position })),
    );
    this.logger.log(`Catalogue initialisé avec ${SEED_MODELS.length} modèles`);
  }

  available() {
    return this.models.find({ where: { enabled: true }, order: { position: 'ASC' } });
  }

  all() {
    return this.models.find({ order: { position: 'ASC' } });
  }

  async create(dto: CreateAiModelDto) {
    if (await this.models.existsBy({ id: dto.id })) {
      throw new BadRequestException('Ce modèle est déjà au catalogue');
    }
    const position = dto.position ?? (await this.models.count());
    return this.models.save(this.models.create({ ...dto, position }));
  }

  async update(id: string, dto: UpdateAiModelDto) {
    const model = await this.byId(id);
    const { refreshWeights, ...changes } = dto;

    Object.assign(model, changes);
    if (refreshWeights) model.revision += 1;

    return this.models.save(model);
  }

  async remove(id: string) {
    await this.byId(id);
    await this.models.delete(id);
    return { id };
  }

  private async byId(id: string) {
    const model = await this.models.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Modèle introuvable');
    return model;
  }
}

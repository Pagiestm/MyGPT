import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { AiModel } from './entities/ai-model.entity';
import { SEED_MODELS } from './ai-model.catalog';

const model = (overrides: Partial<AiModel> = {}) =>
  ({
    id: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B',
    description: 'Bon compromis',
    vramMb: 2264,
    position: 0,
    enabled: true,
    revision: 1,
    ...overrides,
  }) as AiModel;

describe('ModelsService', () => {
  let service: ModelsService;

  const models = {
    count: jest.fn(),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    existsBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    models.count.mockResolvedValue(0);
    models.existsBy.mockResolvedValue(false);
    models.findOne.mockResolvedValue(model());

    const module = await Test.createTestingModule({
      providers: [ModelsService, { provide: getRepositoryToken(AiModel), useValue: models }],
    }).compile();
    service = module.get(ModelsService);
  });

  describe('onModuleInit', () => {
    it('seeds a fresh instance so it works without configuration', async () => {
      await service.onModuleInit();

      const seeded = models.save.mock.calls[0]![0] as AiModel[];
      expect(seeded).toHaveLength(SEED_MODELS.length);
      expect(seeded.map((item) => item.position)).toEqual(SEED_MODELS.map((_, index) => index));
    });

    it('never overwrites a catalogue someone has already edited', async () => {
      models.count.mockResolvedValue(3);
      await service.onModuleInit();

      expect(models.save).not.toHaveBeenCalled();
    });
  });

  describe('available', () => {
    it('hides disabled models and keeps the catalogue order', async () => {
      await service.available();

      expect(models.find).toHaveBeenCalledWith({
        where: { enabled: true },
        order: { position: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('refuses a model already in the catalogue', async () => {
      models.existsBy.mockResolvedValue(true);

      await expect(service.create(model())).rejects.toThrow(BadRequestException);
    });

    it('appends the new model at the end when no position is given', async () => {
      models.count.mockResolvedValue(4);
      const withoutPosition = { ...model(), position: undefined };

      const created = (await service.create(withoutPosition)) as AiModel;

      expect(created.position).toBe(4);
    });

    it('honours an explicit position', async () => {
      models.count.mockResolvedValue(4);

      const created = (await service.create(model({ position: 1 }))) as AiModel;

      expect(created.position).toBe(1);
    });
  });

  describe('update', () => {
    it('bumps the revision when the weights must be refreshed', async () => {
      const updated = (await service.update(model().id, { refreshWeights: true })) as AiModel;

      expect(updated.revision).toBe(2);
    });

    it('leaves the revision alone for an ordinary change', async () => {
      const updated = (await service.update(model().id, { label: 'Llama 3.2' })) as AiModel;

      expect(updated.revision).toBe(1);
      expect(updated.label).toBe('Llama 3.2');
    });

    it('never stores the refresh flag itself', async () => {
      const updated = (await service.update(model().id, { refreshWeights: true })) as AiModel;

      expect(updated).not.toHaveProperty('refreshWeights');
    });

    it('reports an unknown model', async () => {
      models.findOne.mockResolvedValue(null);

      await expect(service.update('webgpu:absent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('reports an unknown model rather than deleting nothing', async () => {
      models.findOne.mockResolvedValue(null);

      await expect(service.remove('webgpu:absent')).rejects.toThrow(NotFoundException);
      expect(models.delete).not.toHaveBeenCalled();
    });
  });
});

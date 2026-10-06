import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AiModel } from '../domain/ai-model';
import { AI_MODEL_REPOSITORY } from '../domain/ai-model.repository';
import { SEED_MODELS } from '../domain/ai-model.catalog';
import {
  AddModel,
  GetModel,
  ListAvailableModels,
  RemoveModel,
  SeedCatalog,
  UpdateModel,
} from './ai-model.use-cases';

const model = () =>
  AiModel.create({
    id: 'webgpu:Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B',
    description: 'Bon compromis',
    vramMb: 2264,
    position: 0,
  });

describe('AI model use cases', () => {
  const models = {
    findById: jest.fn(),
    findEnabled: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    save: jest.fn((saved: AiModel) => Promise.resolve(saved)),
    saveMany: jest.fn(),
    remove: jest.fn(),
  };

  let seed: SeedCatalog;
  let available: ListAvailableModels;
  let add: AddModel;
  let update: UpdateModel;
  let remove: RemoveModel;

  beforeEach(async () => {
    jest.clearAllMocks();
    models.count.mockResolvedValue(0);
    models.findById.mockResolvedValue(null);

    const module = await Test.createTestingModule({
      providers: [
        SeedCatalog,
        ListAvailableModels,
        GetModel,
        AddModel,
        UpdateModel,
        RemoveModel,
        { provide: AI_MODEL_REPOSITORY, useValue: models },
      ],
    }).compile();

    seed = module.get(SeedCatalog);
    available = module.get(ListAvailableModels);
    add = module.get(AddModel);
    update = module.get(UpdateModel);
    remove = module.get(RemoveModel);
  });

  describe('SeedCatalog', () => {
    it('seeds a fresh instance so it works without configuration', async () => {
      await seed.execute();

      const seeded = models.saveMany.mock.calls[0]![0] as AiModel[];
      expect(seeded).toHaveLength(SEED_MODELS.length);
      expect(seeded.map((item) => item.position)).toEqual(SEED_MODELS.map((_, index) => index));
    });

    it('never overwrites a catalogue someone has already edited', async () => {
      models.count.mockResolvedValue(3);

      await seed.execute();

      expect(models.saveMany).not.toHaveBeenCalled();
    });
  });

  describe('ListAvailableModels', () => {
    it('only offers the models that are enabled', async () => {
      models.findEnabled.mockResolvedValue([model()]);

      await available.execute();

      expect(models.findEnabled).toHaveBeenCalled();
      expect(models.findAll).not.toHaveBeenCalled();
    });
  });

  describe('AddModel', () => {
    it('refuses a model already in the catalogue', async () => {
      models.findById.mockResolvedValue(model());

      await expect(add.execute({ ...model() })).rejects.toThrow(BadRequestException);
    });

    it('appends the new model at the end when no position is given', async () => {
      models.count.mockResolvedValue(4);

      const created = await add.execute({ ...model(), position: undefined });

      expect(created.position).toBe(4);
    });

    it('honours an explicit position', async () => {
      models.count.mockResolvedValue(4);

      const created = await add.execute({ ...model(), position: 1 });

      expect(created.position).toBe(1);
    });
  });

  describe('UpdateModel', () => {
    it('bumps the revision when the weights must be refreshed', async () => {
      models.findById.mockResolvedValue(model());

      const updated = await update.execute(model().id, { refreshWeights: true });

      expect(updated.revision).toBe(2);
    });

    it('leaves the revision alone for an ordinary change', async () => {
      models.findById.mockResolvedValue(model());

      const updated = await update.execute(model().id, { label: 'Llama 3.2' });

      expect(updated.revision).toBe(1);
      expect(updated.label).toBe('Llama 3.2');
    });

    it('never stores the refresh flag itself', async () => {
      models.findById.mockResolvedValue(model());

      const updated = await update.execute(model().id, { refreshWeights: true });

      expect(Object.keys(updated)).not.toContain('refreshWeights');
    });

    it('reports an unknown model', async () => {
      await expect(update.execute('webgpu:absent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('RemoveModel', () => {
    it('reports an unknown model rather than deleting nothing', async () => {
      await expect(remove.execute('webgpu:absent')).rejects.toThrow(NotFoundException);
      expect(models.remove).not.toHaveBeenCalled();
    });
  });
});

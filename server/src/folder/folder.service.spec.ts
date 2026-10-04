import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FolderService } from './folder.service';
import { Folder } from './entities/folder.entity';

const folder = (overrides: Partial<Folder> = {}) =>
  ({ id: 'f1', name: 'Cours', instructions: null, userId: 'u1', ...overrides }) as Folder;

describe('FolderService', () => {
  let service: FolderService;
  const repository = {
    create: jest.fn((data: Partial<Folder>) => data),
    save: jest.fn((data: Partial<Folder>) => Promise.resolve({ id: 'f1', ...data })),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [FolderService, { provide: getRepositoryToken(Folder), useValue: repository }],
    }).compile();
    service = module.get(FolderService);
  });

  it('creates a folder for the user', async () => {
    const created = await service.create('u1', { name: 'Cours', instructions: 'Sois bref' });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Cours',
      instructions: 'Sois bref',
      userId: 'u1',
    });
    expect(created).toMatchObject({ id: 'f1', name: 'Cours' });
  });

  it('lists only the folders of the user, by name', async () => {
    repository.find.mockResolvedValue([folder()]);

    await service.findAllForUser('u1');

    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      order: { name: 'ASC' },
    });
  });

  it('finds a folder owned by the user', async () => {
    repository.findOne.mockResolvedValue(folder());

    await expect(service.findOwned('f1', 'u1')).resolves.toMatchObject({ id: 'f1' });
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'f1', userId: 'u1' } });
  });

  it('refuses a folder that belongs to someone else (404, existence non révélée)', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOwned('f1', 'u2')).rejects.toThrow(NotFoundException);
  });

  it('updates name and instructions', async () => {
    repository.findOne.mockResolvedValue(folder());

    const updated = await service.update('f1', 'u1', { instructions: 'Réponds en anglais' });

    expect(updated).toMatchObject({ name: 'Cours', instructions: 'Réponds en anglais' });
  });

  it('removes a folder owned by the user', async () => {
    const owned = folder();
    repository.findOne.mockResolvedValue(owned);

    await service.remove('f1', 'u1');

    expect(repository.remove).toHaveBeenCalledWith(owned);
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Folder } from '../domain/folder';
import { FOLDER_REPOSITORY, type FolderRepository } from '../domain/folder.repository';
import {
  CreateFolder,
  DeleteFolder,
  GetOwnedFolder,
  ListFolders,
  UpdateFolder,
} from './folder.use-cases';

const stored = (overrides: Partial<{ id: string; userId: string; name: string }> = {}) =>
  Folder.rehydrate({
    id: 'f1',
    userId: 'u1',
    name: 'Cours',
    instructions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('Cas d’usage des dossiers', () => {
  let list: ListFolders;
  let owned: GetOwnedFolder;
  let create: CreateFolder;
  let update: UpdateFolder;
  let remove: DeleteFolder;

  const folders: jest.Mocked<FolderRepository> = {
    findById: jest.fn(),
    findAllForUser: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    folders.save.mockImplementation((folder: Folder) => Promise.resolve(folder));
    folders.findById.mockResolvedValue(stored());

    const module = await Test.createTestingModule({
      providers: [
        ListFolders,
        GetOwnedFolder,
        CreateFolder,
        UpdateFolder,
        DeleteFolder,
        { provide: FOLDER_REPOSITORY, useValue: folders },
      ],
    }).compile();

    list = module.get(ListFolders);
    owned = module.get(GetOwnedFolder);
    create = module.get(CreateFolder);
    update = module.get(UpdateFolder);
    remove = module.get(DeleteFolder);
  });

  describe('GetOwnedFolder', () => {
    it('rend le dossier de son propriétaire', async () => {
      expect((await owned.execute('f1', 'u1')).id).toBe('f1');
    });

    it('masque le dossier d’un autre derrière un 404', async () => {
      folders.findById.mockResolvedValue(stored({ userId: 'u2' }));

      await expect(owned.execute('f1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('signale un dossier inexistant', async () => {
      folders.findById.mockResolvedValue(null);

      await expect(owned.execute('absent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('ListFolders', () => {
    it('ne demande que les dossiers du compte', async () => {
      folders.findAllForUser.mockResolvedValue([]);
      await list.execute('u1');

      expect(folders.findAllForUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('CreateFolder', () => {
    it('enregistre un dossier rattaché au compte', async () => {
      const created = await create.execute('u1', { name: '  Cours  ' });

      expect(created.userId).toBe('u1');
      expect(created.name).toBe('Cours');
    });
  });

  describe('UpdateFolder', () => {
    it('ne touche qu’aux champs fournis', async () => {
      folders.findById.mockResolvedValue(stored({ name: 'Avant' }));

      const result = await update.execute('f1', 'u1', { instructions: 'Sois concis' });

      expect(result.name).toBe('Avant');
      expect(result.instructions).toBe('Sois concis');
    });

    it('refuse de modifier le dossier d’un autre', async () => {
      folders.findById.mockResolvedValue(stored({ userId: 'u2' }));

      await expect(update.execute('f1', 'u1', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(folders.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteFolder', () => {
    it('supprime après avoir vérifié la propriété', async () => {
      await remove.execute('f1', 'u1');

      expect(folders.remove).toHaveBeenCalledWith('f1');
    });

    it('refuse de supprimer le dossier d’un autre', async () => {
      folders.findById.mockResolvedValue(stored({ userId: 'u2' }));

      await expect(remove.execute('f1', 'u1')).rejects.toThrow(NotFoundException);
      expect(folders.remove).not.toHaveBeenCalled();
    });
  });
});

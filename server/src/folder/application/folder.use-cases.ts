import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Folder } from '../domain/folder';
import { FOLDER_REPOSITORY, type FolderRepository } from '../domain/folder.repository';

export interface FolderInput {
  name?: string;
  instructions?: string | null;
}

@Injectable()
export class ListFolders {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  execute(userId: string): Promise<Folder[]> {
    return this.folders.findAllForUser(userId);
  }
}

@Injectable()
export class GetOwnedFolder {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  async execute(id: string, userId: string): Promise<Folder> {
    const folder = await this.folders.findById(id);
    if (!folder?.belongsTo(userId)) throw new NotFoundException('Dossier introuvable');
    return folder;
  }
}

@Injectable()
export class CreateFolder {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository) {}

  execute(userId: string, input: Required<Pick<FolderInput, 'name'>> & FolderInput) {
    return this.folders.save(Folder.create(userId, input.name, input.instructions));
  }
}

@Injectable()
export class UpdateFolder {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    private readonly owned: GetOwnedFolder,
  ) {}

  async execute(id: string, userId: string, input: FolderInput): Promise<Folder> {
    const folder = await this.owned.execute(id, userId);
    if (input.name !== undefined) folder.rename(input.name);
    if (input.instructions !== undefined) folder.guideWith(input.instructions);
    return this.folders.save(folder);
  }
}

@Injectable()
export class DeleteFolder {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    private readonly owned: GetOwnedFolder,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const folder = await this.owned.execute(id, userId);
    await this.folders.remove(folder.id);
  }
}

import type { Folder } from './folder';

export const FOLDER_REPOSITORY = Symbol('FolderRepository');

export interface FolderRepository {
  findById(id: string): Promise<Folder | null>;
  findAllForUser(userId: string): Promise<Folder[]>;
  save(folder: Folder): Promise<Folder>;
  remove(id: string): Promise<void>;
}

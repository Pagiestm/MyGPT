import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../../domain/folder';
import type { FolderRepository } from '../../domain/folder.repository';
import { FolderOrm } from './folder.orm-entity';

@Injectable()
export class TypeormFolderRepository implements FolderRepository {
  constructor(@InjectRepository(FolderOrm) private readonly folders: Repository<FolderOrm>) {}

  async findById(id: string): Promise<Folder | null> {
    const row = await this.folders.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findAllForUser(userId: string): Promise<Folder[]> {
    const rows = await this.folders.find({ where: { userId }, order: { name: 'ASC' } });
    return rows.map(toDomain);
  }

  async save(folder: Folder): Promise<Folder> {
    const saved = await this.folders.save(this.folders.create(toOrm(folder)));
    return toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.folders.delete(id);
  }
}

function toDomain(row: FolderOrm): Folder {
  return Folder.rehydrate({
    id: row.id,
    userId: row.userId,
    name: row.name,
    instructions: row.instructions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(folder: Folder): Partial<FolderOrm> {
  return {
    ...(folder.id ? { id: folder.id } : {}),
    userId: folder.userId,
    name: folder.name,
    instructions: folder.instructions,
  };
}

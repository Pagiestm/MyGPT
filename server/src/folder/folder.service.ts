import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@Injectable()
export class FolderService {
  constructor(@InjectRepository(Folder) private readonly folders: Repository<Folder>) {}

  create(userId: string, dto: CreateFolderDto) {
    const folder = this.folders.create({ ...dto, userId });
    return this.folders.save(folder);
  }

  findAllForUser(userId: string) {
    return this.folders.find({ where: { userId }, order: { name: 'ASC' } });
  }

  // Un dossier d'un autre utilisateur répond 404 : on ne révèle pas son existence
  async findOwned(id: string, userId: string) {
    const folder = await this.folders.findOne({ where: { id, userId } });
    if (!folder) throw new NotFoundException('Dossier introuvable');
    return folder;
  }

  async update(id: string, userId: string, dto: UpdateFolderDto) {
    const folder = await this.findOwned(id, userId);
    Object.assign(folder, dto);
    return this.folders.save(folder);
  }

  async remove(id: string, userId: string) {
    const folder = await this.findOwned(id, userId);
    await this.folders.remove(folder);
  }
}

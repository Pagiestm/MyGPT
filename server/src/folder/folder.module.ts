import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CreateFolder,
  DeleteFolder,
  GetOwnedFolder,
  ListFolders,
  UpdateFolder,
} from './application/folder.use-cases';
import { FOLDER_REPOSITORY } from './domain/folder.repository';
import { FolderOrm } from './infrastructure/persistence/folder.orm-entity';
import { TypeormFolderRepository } from './infrastructure/persistence/typeorm-folder.repository';
import { FolderController } from './infrastructure/http/folder.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FolderOrm])],
  controllers: [FolderController],
  providers: [
    { provide: FOLDER_REPOSITORY, useClass: TypeormFolderRepository },
    ListFolders,
    GetOwnedFolder,
    CreateFolder,
    UpdateFolder,
    DeleteFolder,
  ],
  exports: [GetOwnedFolder],
})
export class FolderModule {}

import { ApiProperty } from '@nestjs/swagger';
import type { Folder } from '../../../domain/folder';

export class FolderResponse {
  @ApiProperty({ example: 'f1e2d3c4-1234-4abc-bdef-ff123456789a' })
  id: string;

  @ApiProperty({ example: 'Cours de JavaScript' })
  name: string;

  @ApiProperty({ example: 'Explique comme à un étudiant de première année.', nullable: true })
  instructions: string | null;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(folder: Folder): FolderResponse {
    return {
      id: folder.id,
      name: folder.name,
      instructions: folder.instructions,
      userId: folder.userId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}

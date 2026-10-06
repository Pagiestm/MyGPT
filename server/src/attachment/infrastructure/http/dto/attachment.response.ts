import { ApiProperty } from '@nestjs/swagger';
import type { Attachment } from '../../../domain/attachment';

export class AttachmentResponse {
  @ApiProperty({ example: 'a9b8c7d6-1234-4abc-bdef-ff123456789a' })
  id: string;

  @ApiProperty({ description: 'Nom du fichier', example: 'schema.png' })
  name: string;

  @ApiProperty({ description: 'Type MIME', example: 'image/png' })
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets', example: 48213 })
  size: number;

  static from(attachment: Attachment): AttachmentResponse {
    return {
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }
}

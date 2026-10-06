import { ApiProperty } from '@nestjs/swagger';
import type { KnowledgeDocument } from '../../../domain/knowledge-document';

export class KnowledgeDocumentResponse {
  @ApiProperty({ example: 'd1e2f3a4-1234-4abc-bdef-ff123456789a' })
  id: string;

  @ApiProperty({ description: 'Nom du fichier', example: 'procedure-interne.md' })
  name: string;

  @ApiProperty({ description: 'Type MIME', example: 'text/plain' })
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets', example: 18234 })
  size: number;

  @ApiProperty({ description: 'Nombre de fragments indexés', example: 12 })
  chunkCount: number;

  @ApiProperty({
    description: "Modèle d'embedding utilisé : seuls les fragments du modèle courant sont comparés",
    example: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
  })
  embeddingModel: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  folderId: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(document: KnowledgeDocument): KnowledgeDocumentResponse {
    return {
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      size: document.size,
      chunkCount: document.chunkCount,
      embeddingModel: document.embeddingModel,
      userId: document.userId,
      folderId: document.folderId,
      createdAt: document.createdAt,
    };
  }
}

export class KnowledgeMatchResponse {
  @ApiProperty({ description: 'Extrait du document' })
  content: string;

  @ApiProperty({ description: 'Document dont provient l’extrait' })
  name: string;

  @ApiProperty({ description: 'Proximité avec la requête, de 0 à 1', example: 0.82 })
  score: number;

  static from(match: { content: string; name: string; score: number | string }) {
    return { content: match.content, name: match.name, score: Number(match.score) };
  }
}

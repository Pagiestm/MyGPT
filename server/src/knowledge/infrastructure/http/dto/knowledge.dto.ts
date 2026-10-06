import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsUUID } from 'class-validator';
import { PaginationDto } from '../../../../common/pagination.dto';
import { EMBEDDING_DIMENSIONS, MAX_DOCUMENT_SIZE } from '../../../domain/knowledge-document';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Dossier auquel réserver le document ; absent, il vaut pour tout le compte',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}

export class ListDocumentsDto extends IntersectionType(UploadDocumentDto, PaginationDto) {}

export class ChunkDto {
  @ApiProperty({ description: "Texte de l'extrait" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;

  @ApiProperty({ description: 'Vecteur calculé par le navigateur', type: [Number] })
  @IsArray()
  @ArrayMinSize(EMBEDDING_DIMENSIONS)
  @ArrayMaxSize(EMBEDDING_DIMENSIONS)
  @IsNumber({}, { each: true })
  embedding: number[];
}

export class SearchKnowledgeDto extends UploadDocumentDto {
  @ApiProperty({ description: 'Vecteur de la requête, calculé par le navigateur', type: [Number] })
  @IsArray()
  @ArrayMinSize(EMBEDDING_DIMENSIONS)
  @ArrayMaxSize(EMBEDDING_DIMENSIONS)
  @IsNumber({}, { each: true })
  embedding: number[];

  @ApiProperty({ required: false, description: 'Nombre maximum d’extraits renvoyés' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}

export class StoreDocumentDto extends UploadDocumentDto {
  @ApiProperty({ description: 'Nom du fichier', example: 'procedure.md' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Type MIME', example: 'text/markdown' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets', example: 18234 })
  @IsInt()
  @Min(1)
  @Max(MAX_DOCUMENT_SIZE)
  size: number;

  @ApiProperty({
    description: "Modèle d'embedding employé par le navigateur",
    example: 'snowflake-arctic-embed-m-q0f32-MLC-b4',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  embeddingModel: string;

  @ApiProperty({ description: 'Extraits vectorisés', type: [ChunkDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => ChunkDto)
  chunks: ChunkDto[];
}

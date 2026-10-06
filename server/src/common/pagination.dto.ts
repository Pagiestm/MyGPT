import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export class PaginationDto {
  @ApiProperty({ required: false, default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function pageBounds({ limit, offset }: PaginationDto = {}) {
  return { take: limit ?? DEFAULT_PAGE_SIZE, skip: offset ?? 0 };
}

export function toPage<T>(
  items: T[],
  total: number,
  { limit, offset }: PaginationDto = {},
): Page<T> {
  const { take, skip } = pageBounds({ limit, offset });
  return { items, total, limit: take, offset: skip, hasMore: skip + items.length < total };
}

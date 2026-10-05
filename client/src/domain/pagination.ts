export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const PAGE_SIZE = 25;

export function emptyPage<T>(): Page<T> {
  return { items: [], total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false };
}

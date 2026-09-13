export type ApiPaginationInput = {
  limit?: number;
  cursor?: string;
  offset?: number;
  sort?: string;
};

export type ApiPaginationMeta = {
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
};

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;

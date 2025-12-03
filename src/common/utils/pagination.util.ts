export interface PaginationOptions {
  skip?: number;
  limit?: number;
  sort?: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function calculatePagination(
  total: number,
  skip: number,
  limit: number,
): PaginationMeta {
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
  };
}


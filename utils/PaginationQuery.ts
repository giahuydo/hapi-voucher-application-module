import { Model } from 'mongoose';

export interface PaginationQuery {
    page?: number;             // page number
    limit?: number;            // items per page
    sortBy?: string;           // e.g. "createdAt" or "code"
    sortOrder?: 'asc' | 'desc';
    search?: string;           // text search (optional)
    filters?: Record<string, any>; // dynamic filters e.g. { isUsed: true, eventId: 'xyz' }
  }

  export interface PaginatedResult<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
  }

  export function buildPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }


  interface PaginateOptions<T> {
    model: Model<T>;
    query: PaginationQuery;
    transform: (doc: any) => any;
    searchableFields?: string[]; // e.g. ['code', 'email']
  }
  
  export async function paginateModel<T>({
    model,
    query,
    transform,
    searchableFields = [],
  }: PaginateOptions<T>): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;
  
    const sort: Record<string, 1 | -1> = {
      [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1,
    };
  
    const filters: any = { ...(query.filters || {}) };
  
    if (query.search?.trim() && searchableFields.length > 0) {
      filters.$or = searchableFields.map((field) => ({
        [field]: { $regex: query.search!.trim(), $options: 'i' },
      }));
    }
  
    const [total, results] = await Promise.all([
      model.countDocuments(filters),
      model.find(filters).sort(sort).skip(skip).limit(limit).lean(),
    ]);
  
    return {
      data: results.map(transform),
      meta: buildPaginationMeta(total, page, limit),
    };
  }
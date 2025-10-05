import { log } from 'console';
import { Model } from 'mongoose';
import { logger } from './logger';

export interface PaginationQuery {
    page?: number;             // page number
    limit?: number;            // items per page
    sortBy?: string;           // e.g. "createdAt" or "code"
    sortOrder?: 'asc' | 'desc';
    search?: string;           // text search (optional)
    filters?: Record<string, any>; // dynamic filters e.g. { isUsed: true, eventId: 'xyz' }
    searchFields?: Record<string, any>; // dynamic search fields e.g. { code: 'ABC123', issuedTo: 'user123', issuedCount: { $gte: 10 } }
  }

export interface FieldType {
    type: 'string' | 'objectId' | 'boolean' | 'number';
    exact?: boolean; // for string fields, whether to use exact match or regex
    operators?: string[]; // for numeric fields, allowed operators like ['gte', 'lte', 'gt', 'lt']
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

  /**
   * Basic pagination parser - just extracts pagination params
   * Each module handles its own filtering logic
   */
  export function parsePagination(query: Record<string, any>): {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
  } {
    return {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
      search: query.search as string | undefined
    };
  }

  /**
   * Helper to extract filters from query - modules decide what to use
   */
  export function extractFilters(query: Record<string, any>, allowedFields?: string[]): Record<string, any> {
    const filters: Record<string, any> = {};
    
    Object.keys(query).forEach(key => {
      // Skip pagination params
      if (['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) {
        return;
      }

      // If allowedFields specified, only use those
      if (allowedFields && !allowedFields.includes(key)) {
        return;
      }

      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        filters[key] = value;
      }
    });

    return filters;
  }

  interface PaginateOptions<T> {
    model: Model<T>;
    query: PaginationQuery;
    transform: (doc: any) => any;
    searchableFields?: string[]; // e.g. ['code', 'email']
    fieldTypes?: Record<string, FieldType>; // field type definitions
  }
  
  export async function paginateModel<T>({
    model,
    query = {},
    transform,
    searchableFields = [],
    fieldTypes = {},
  }: PaginateOptions<T>): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 10));
    const skip = (page - 1) * limit;
  
    const sort: Record<string, 1 | -1> = {
      [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1,
    };
  
    const filters: any = { ...(query.filters || {}) };
  
    // Handle general search
    if (query.search?.trim() && searchableFields.length > 0) {
      filters.$or = searchableFields.map((field) => ({
        [field]: { $regex: query.search!.trim(), $options: 'i' },
      }));
    }

    // Handle specific field searches
    if (query.searchFields && Object.keys(query.searchFields).length > 0) {
      Object.entries(query.searchFields).forEach(([field, value]) => {
        const fieldType = fieldTypes[field];
        
        if (fieldType?.type === 'objectId') {
          // For ObjectId fields, use exact match
          filters[field] = value;
        } else if (fieldType?.type === 'number') {
          // For numeric fields, handle operators
          if (typeof value === 'object' && value !== null) {
            // Value is an object with operators like { $gte: 10, $lte: 50 }
            filters[field] = value;
          } else {
            // Exact match for numeric fields
            filters[field] = Number(value);
          }
        } else if (fieldType?.type === 'string' && fieldType.exact) {
          // For string fields with exact match
          filters[field] = value;
        } else {
          // For string fields, use case-insensitive regex
          filters[field] = { $regex: value, $options: 'i' };
        }
      });
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
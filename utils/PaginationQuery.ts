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
    searchFields?: Record<string, string>; // dynamic search fields e.g. { code: 'ABC123', issuedTo: 'user123' }
  }

export interface FieldType {
    type: 'string' | 'objectId' | 'boolean' | 'number';
    exact?: boolean; // for string fields, whether to use exact match or regex
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
   * Parse dynamic search parameters from query object
   * Extracts parameters like search.field into searchFields object
   */
  export function parseSearchParameters(
    query: Record<string, any>, 
    searchableFields: string[] = [],
    fieldTypes: Record<string, FieldType> = {}
  ): {
    paginationQuery: PaginationQuery;
    searchFields: Record<string, string>;
  } {
    const paginationQuery: PaginationQuery = {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      sortBy: query.sortBy as string | undefined,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      search: query.search as string | undefined,
      filters: {},
    };

    const searchFields: Record<string, string> = {};

    // Extract search.field parameters for allowed fields only
    Object.keys(query).forEach(key => {
      if (key.startsWith('search.')) {
        const field = key.slice(7); // Remove 'search.'
        const value = query[key];
        if (value && typeof value === 'string' && value.trim()) {
          // Only allow search on searchable fields
          if (searchableFields.includes(field)) {
            searchFields[field] = value.trim();
          } else {
            logger.warn(`Search field '${field}' is not allowed. Allowed fields: ${searchableFields.join(', ')}`);
          }
        }
      }
    });

    // Parse JSON searchFields if provided
    if (query.searchFields && typeof query.searchFields === 'string') {
      try {
        const jsonSearchFields = JSON.parse(query.searchFields);
        // Only allow search on searchable fields from JSON
        Object.keys(jsonSearchFields).forEach(field => {
          if (searchableFields.includes(field)) {
            searchFields[field] = jsonSearchFields[field];
          } else {
            logger.warn(`Search field '${field}' from JSON is not allowed. Allowed fields: ${searchableFields.join(', ')}`);
          }
        });
      } catch (error) {
        logger.warn('Invalid JSON in searchFields parameter');
      }
    }

    // Extract other filter parameters
    const filterKeys = ['eventId', 'issuedTo', 'isUsed', 'userId', 'code'];
    filterKeys.forEach(key => {
      if (query[key] !== undefined) {
        let value = query[key];
        if (key === 'isUsed') {
          value = value === 'true';
        }
        paginationQuery.filters![key] = value;
      }
    });

    return { paginationQuery, searchFields };
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
        } else if (fieldType?.type === 'string' && fieldType.exact) {
          // For string fields with exact match
          filters[field] = value;
        } else {
          // For string fields, use case-insensitive regex
          filters[field] = { $regex: value, $options: 'i' };
        }
      });
    }

    logger.info(`[paginateModel] Filters: ${JSON.stringify(filters)}`);
  
    const [total, results] = await Promise.all([
      model.countDocuments(filters),
      model.find(filters).sort(sort).skip(skip).limit(limit).lean(),
    ]);
  
    return {
      data: results.map(transform),
      meta: buildPaginationMeta(total, page, limit),
    };
  }
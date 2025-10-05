import { Request, ResponseToolkit } from '@hapi/hapi';
import { parsePagination, extractFilters } from '../../../../utils/PaginationQuery';

/**
 * Example: Ultra-simple user handler
 * Each module decides exactly what filters it wants
 */
export const getAllUsers = async (req: Request, h: ResponseToolkit) => {
  try {
    // 1. Parse basic pagination (always the same)
    const pagination = parsePagination(req.query);
    
    // 2. Extract filters - user module decides what it wants
    const filters = extractFilters(req.query, [
      'email', 'isActive', 'role', 'createdFrom', 'createdTo'
    ]);
    
    // 3. Convert types as needed
    if (filters.isActive !== undefined) {
      filters.isActive = filters.isActive === 'true';
    }
    
    // 4. Use in service
    const result = await UserService.getAllUsers({
      ...pagination,
      filters
    });
    
    return h.response({ success: true, ...result });
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Example: Even simpler - no allowed fields, use everything
 */
export const getAllUsersSimple = async (req: Request, h: ResponseToolkit) => {
  try {
    const pagination = parsePagination(req.query);
    const filters = extractFilters(req.query); // No allowedFields = use all
    
    const result = await UserService.getAllUsers({
      ...pagination,
      filters
    });
    
    return h.response({ success: true, ...result });
  } catch (err) {
    return formatError(h, err);
  }
};

import Joi from 'joi';

export interface IssueVoucherInput {
  eventId: string;
  userId: string;
}

/**
 * Input used for issuing a voucher.
 * Used in: POST /api/vouchers/issue
 */
export const IdVoucherParamsSchema = Joi.object<{ id: string }>({
  id: Joi.string()
    .length(24)
    .required()
    .description("Voucher MongoDB ObjectId"),
});

export const eventIdParamSchema = Joi.object<{ eventId: string }>({
  eventId: Joi.string().length(24).required().description('MongoDB ObjectId of the event'),
});

/**
 * Generate dynamic search schema based on searchable fields
 */
export function generateSearchSchema(searchableFields: string[]) {
  const baseSchema = {
    page: Joi.number().integer().min(1).default(1).description('Page number for pagination'),
    limit: Joi.number().integer().min(1).max(100).default(10).description('Number of items per page'),
    eventId: Joi.string().length(24).description('Filter vouchers by event ID'),
    issuedTo: Joi.string().description('Filter vouchers by user ID'),
    isUsed: Joi.boolean().description('Filter vouchers by usage status'),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'code').default('createdAt').description('Sort field'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order'),
    search: Joi.string().min(1).description('General search across all searchable fields'),
    // Alternative: JSON string for complex search
    searchFields: Joi.string().description('JSON string of search fields: {"code": "ABC123", "issuedTo": "user123"}')
  };

  // Add dynamic search fields
  const searchFields: Record<string, Joi.StringSchema> = {};
  searchableFields.forEach(field => {
    searchFields[`search.${field}`] = Joi.string().min(1).description(`Search vouchers by ${field} field`);
  });

  return Joi.object({
    ...baseSchema,
    ...searchFields
  }).unknown(true);
}

/**
 * Query parameters for getting all vouchers
 * Used in: GET /api/vouchers
 */
export const getAllVouchersQuerySchema = generateSearchSchema(['code', 'issuedTo', 'eventId', 'userId']);


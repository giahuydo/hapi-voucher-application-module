import Joi from 'joi';

export interface IssueVoucherInput {
  eventId: string;
  userId: string;
}

/**
 * Path parameter schema for voucher ID
 * Used in: GET /vouchers/{id}, DELETE /vouchers/{id}, etc.
 */
export const IdVoucherParamsSchema = Joi.object({
  id: Joi.string().length(24).required().description('Voucher ID')
});

/**
 * Path parameter schema for event ID (shared with event module)
 * Used in: POST /vouchers/issue
 */
export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().length(24).required().description('Event ID')
});

/**
 * Query parameters for getting all vouchers
 * Used in: GET /api/vouchers
 */
export const getAllVouchersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Page number'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Items per page'),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'code').default('createdAt').description('Sort field'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').description('Sort order'),
  search: Joi.string().min(1).description('Search across all fields'),
  eventId: Joi.string().length(24).description('Filter by event ID'),
  issuedTo: Joi.string().description('Filter by user ID'),
  isUsed: Joi.boolean().description('Filter by usage status')
}).unknown(true);

/**
 * Payload schema for issuing a voucher
 * Used in: POST /api/vouchers/issue
 */
export const issueVoucherPayloadSchema = Joi.object({
  eventId: Joi.string().required().description('Event ID to issue voucher for')
});

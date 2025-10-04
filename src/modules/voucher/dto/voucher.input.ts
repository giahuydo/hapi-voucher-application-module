import Joi from 'joi';

export interface IssueVoucherInput {
  eventId: string;
  userId: string;
  issueTo: string; // Email address to issue voucher to
  // Optional voucher fields
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  usageLimit?: number;
  // Date fields (consolidated)
  validFrom?: string;    // When voucher becomes valid
  validTo?: string;      // When voucher expires
  // Additional fields for CreateVoucherRequest
  recipientName?: string;
  phoneNumber?: string;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  notes?: string;
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
  eventId: Joi.string().length(24).required().description('Event ID to issue voucher for'),
  issueTo: Joi.string().email().required().description('Email address to issue voucher to'),
  // Optional voucher fields
  name: Joi.string().optional().description('Voucher name'),
  description: Joi.string().optional().description('Voucher description'),
  type: Joi.string().valid('percentage', 'fixed').optional().description('Voucher type'),
  value: Joi.number().min(0).optional().description('Voucher value'),
  usageLimit: Joi.number().min(1).optional().description('Maximum usage limit'),
  // Date fields (consolidated)
  validFrom: Joi.string().isoDate().optional().description('When voucher becomes valid'),
  validTo: Joi.string().isoDate().optional().description('When voucher expires'),
  // Additional fields for CreateVoucherRequest
  recipientName: Joi.string().optional().description('Recipient name'),
  phoneNumber: Joi.string().optional().description('Phone number'),
  minimumOrderAmount: Joi.number().min(0).optional().description('Minimum order amount required'),
  maximumDiscount: Joi.number().min(0).optional().description('Maximum discount amount'),
  notes: Joi.string().optional().description('Additional notes')
});

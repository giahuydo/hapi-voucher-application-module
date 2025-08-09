import Joi from 'joi';
import { 
  baseSchemas, 
  responseSchemas, 
  swaggerResponses, 
  createResponseSchema, 
  generateSearchSchema,
  createInputSchemas 
} from '../../../../utils/schemas';

// ============================================================================
// VOUCHER-SPECIFIC SCHEMAS
// ============================================================================

// Voucher-specific input schemas
export const inputSchemas = {
  // Path parameters
  params: {
    voucherId: createInputSchemas.params.id('id'),
    eventId: createInputSchemas.params.eventId,
  },

  // Query parameters
  query: {
    voucherSearch: createInputSchemas.query.voucherSearch,
  },

  // Request body schemas
  body: {
    issueVoucher: Joi.object({
      userId: baseSchemas.objectId.description('User ID who will receive the voucher')
    }),
  }
};

// Voucher-specific response schemas
export const voucherResponseSchemas = {
  // Voucher object with populated event
  voucherWithEvent: Joi.object({
    id: Joi.string().description('Voucher ID'),
    eventId: Joi.string().description('Associated event ID'),
    issuedTo: Joi.string().description('User ID who received the voucher'),
    code: Joi.string().description('Unique voucher code'),
    isUsed: Joi.boolean().description('Whether the voucher has been used'),
    ...baseSchemas.timestamps,
    // Populated event information
    event: responseSchemas.objects.event.optional()
  }),

  // Voucher code response (for issue voucher)
  voucherCode: Joi.object({
    code: Joi.string().description('Generated voucher code')
  })
};

// ============================================================================
// VOUCHER-SPECIFIC SWAGGER RESPONSES
// ============================================================================

export const voucherSwaggerResponses = {
  // Issue voucher response
  issueSuccess: {
    description: 'Voucher issued successfully',
    schema: createResponseSchema.single(voucherResponseSchemas.voucherCode)
  },

  // Get voucher list response
  listSuccess: {
    description: 'List of all vouchers with populated event information',
    schema: createResponseSchema.single(Joi.object({
      vouchers: Joi.array().items(voucherResponseSchemas.voucherWithEvent),
      pagination: responseSchemas.pagination
    }))
  },

  // Get single voucher response
  singleSuccess: {
    description: 'Voucher details with populated event information',
    schema: createResponseSchema.single(voucherResponseSchemas.voucherWithEvent)
  },

  // Delete voucher response
  deleteSuccess: {
    description: 'Voucher deleted successfully',
    schema: createResponseSchema.single(Joi.object({
      message: Joi.string().default('Voucher deleted successfully')
    }))
  },

  // Voucher exhausted
  exhausted: {
    description: 'Voucher exhausted',
    schema: createResponseSchema.error('Voucher exhausted')
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate voucher search schema
export function generateVoucherSearchSchema() {
  return generateSearchSchema(['code', 'issuedTo', 'eventId', 'userId'], {
    eventId: baseSchemas.optionalObjectId.description('Filter vouchers by event ID'),
    issuedTo: Joi.string().description('Filter vouchers by user ID'),
    isUsed: Joi.boolean().description('Filter vouchers by usage status')
  });
}

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

// Legacy schemas for backward compatibility
export const voucherSchemas = {
  eventObject: responseSchemas.objects.event,
  voucherObject: voucherResponseSchemas.voucherWithEvent,
  paginationObject: responseSchemas.pagination,
  successResponse: responseSchemas.success,
  errorResponse: responseSchemas.error,
  responses: {
    401: swaggerResponses.common[401],
    404: swaggerResponses.common[404],
    409: swaggerResponses.common[409]
  }
};

export const commonSchemas = {
  successResponse: responseSchemas.success,
  errorResponse: responseSchemas.error,
  paginationObject: responseSchemas.pagination,
  responses: swaggerResponses.common
};

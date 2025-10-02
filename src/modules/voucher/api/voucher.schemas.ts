import Joi from 'joi';
import { 
  baseSchemas, 
  responseSchemas
} from '../../../../utils/schemas';

// ============================================================================
// VOUCHER-SPECIFIC SCHEMAS
// ============================================================================

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
  }).label('VoucherWithEvent'),

  // Voucher code response (for issue voucher)
  voucherCode: Joi.object({
    code: Joi.string().description('Generated voucher code')
  }).label('VoucherCode')
};

// ============================================================================
// VOUCHER-SPECIFIC SWAGGER RESPONSES
// ============================================================================

export const voucherSwaggerResponses = {
  // Issue voucher response
  issueSuccess: {
    description: 'Voucher issued successfully',
    schema: Joi.object({
      success: Joi.boolean().default(true),
      message: Joi.string().default('Voucher issued successfully'),
      data: voucherResponseSchemas.voucherCode
    }).label('IssueVoucherResponse')
  },

  // Get voucher list response
  listSuccess: {
    description: 'List of all vouchers with populated event information',
    schema: Joi.object({
      success: Joi.boolean().default(true),
      message: Joi.string().default('Vouchers retrieved successfully'),
      data: Joi.object({
        vouchers: Joi.array().items(voucherResponseSchemas.voucherWithEvent),
        pagination: responseSchemas.pagination
      }).label('VoucherListData')
    }).label('VoucherListResponse')
  },

  // Get single voucher response
  singleSuccess: {
    description: 'Voucher details with populated event information',
    schema: Joi.object({
      success: Joi.boolean().default(true),
      message: Joi.string().default('Voucher retrieved successfully'),
      data: voucherResponseSchemas.voucherWithEvent
    }).label('SingleVoucherResponse')
  },

  // Delete voucher response
  deleteSuccess: {
    description: 'Voucher deleted successfully',
    schema: Joi.object({
      success: Joi.boolean().default(true),
      message: Joi.string().default('Voucher deleted successfully')
    }).label('DeleteVoucherResponse')
  },

  // Voucher exhausted
  exhausted: {
    description: 'Voucher exhausted',
    schema: Joi.object({
      success: Joi.boolean().default(false),
      message: Joi.string().default('Voucher exhausted')
    }).label('VoucherExhaustedResponse')
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Legacy schemas removed - use shared schemas from /utils/schemas.ts instead

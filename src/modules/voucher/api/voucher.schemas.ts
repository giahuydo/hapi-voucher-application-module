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
    createdAt: Joi.string().isoDate().description('Creation timestamp'),
    updatedAt: Joi.string().isoDate().description('Last update timestamp'),
    // Voucher specific fields
    name: Joi.string().optional().description('Voucher name'),
    description: Joi.string().optional().description('Voucher description'),
    type: Joi.string().valid('percentage', 'fixed').optional().description('Voucher type'),
    value: Joi.number().min(0).optional().description('Voucher value'),
    usedCount: Joi.number().min(0).optional().description('Number of times voucher has been used'),
    usageLimit: Joi.number().min(1).optional().description('Maximum usage limit'),
    isActive: Joi.boolean().optional().description('Whether the voucher is active'),
    // Date fields (consolidated)
    validFrom: Joi.string().isoDate().optional().description('When voucher becomes valid'),
    validTo: Joi.string().isoDate().optional().description('When voucher expires'),
    // Additional fields for CreateVoucherRequest
    recipientName: Joi.string().optional().description('Recipient name'),
    phoneNumber: Joi.string().optional().description('Phone number'),
    minimumOrderAmount: Joi.number().min(0).optional().description('Minimum order amount required'),
    maximumDiscount: Joi.number().min(0).optional().description('Maximum discount amount'),
    notes: Joi.string().optional().description('Additional notes'),
    // Populated event information
    event: Joi.object({
      id: Joi.string().description('Event ID'),
      name: Joi.string().description('Event name'),
      description: Joi.string().description('Event description'),
      maxQuantity: Joi.number().description('Maximum voucher quantity for event'),
      issuedCount: Joi.number().description('Number of vouchers issued for event'),
      isActive: Joi.boolean().description('Whether the event is active'),
      createdAt: Joi.string().isoDate().description('Event creation timestamp'),
      updatedAt: Joi.string().isoDate().description('Event last update timestamp')
    }).required()
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

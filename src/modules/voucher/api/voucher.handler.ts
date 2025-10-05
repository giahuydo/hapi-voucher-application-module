import { Request, ResponseToolkit } from '@hapi/hapi';
import * as VoucherService from '../voucher.service';
import { IssueVoucherInput } from '../dto/voucher.input';
import { formatSuccess, formatError } from '../../../../utils/responseFormatter';
import { logger } from '../../../../utils/logger';
import { parseSearchParameters } from '../../../../utils/PaginationQuery';

/**
 * Get all vouchers
 */
export const getAllVouchers = async (req: Request, h: ResponseToolkit) => {
  try {
    // Define searchable fields and their types for vouchers
    const searchableFields = [
      'code', 'issuedTo', 'eventId', 'userId', 'type', 'isActive', 
      'isUsed', 'status', 'validFrom', 'validTo', 'createdFrom', 'createdTo'
    ];
    const fieldTypes = {
      code: { type: 'string' as const },
      issuedTo: { type: 'objectId' as const },
      eventId: { type: 'objectId' as const },
      userId: { type: 'objectId' as const },
      type: { type: 'string' as const },
      isActive: { type: 'boolean' as const },
      isUsed: { type: 'boolean' as const },
      status: { type: 'string' as const },
      validFrom: { type: 'string' as const },
      validTo: { type: 'string' as const },
      createdFrom: { type: 'string' as const },
      createdTo: { type: 'string' as const }
    };
    
    // Parse dynamic search parameters with allowed fields and types
    const { paginationQuery, searchFields } = parseSearchParameters(req.query, searchableFields, fieldTypes);
    
    // Merge searchFields into paginationQuery
    const query = {
      ...paginationQuery,
      searchFields
    };
    
    const result = await VoucherService.getAllVouchers(query);
    return h
    .response({
      success: true,
      ...result,
    })
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Get voucher by ID
 */
export const getVoucherById = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const voucher = await VoucherService.getVoucherById(id);
    return formatSuccess(h, voucher, 'Voucher found');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Mark voucher as used
 */
export const useVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const voucher = await VoucherService.markVoucherAsUsed(id);
    return formatSuccess(h, voucher, 'Voucher marked as used');
  } catch (err) {
    return formatError(h, err);
  }
};

export const releaseVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const voucher = await VoucherService.releaseVoucher(id);
    return formatSuccess(h, voucher, 'Voucher marked as used');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Delete voucher by ID
 */
export const deleteVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const result = await VoucherService.deleteVoucher(id);
    return formatSuccess(h, result, 'Voucher deleted successfully');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Get voucher filter options (events, statuses, types)
 */
export const getVoucherFilterOptions = async (req: Request, h: ResponseToolkit) => {
  try {
    const options = await VoucherService.getVoucherFilterOptions();
    return formatSuccess(h, options, 'Filter options retrieved successfully');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Issue a new voucher for an event
 */
export const issueVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const payload = req.payload as any;
    const { 
      eventId, 
      issueTo, 
      name, 
      description, 
      type, 
      value, 
      usageLimit, 
      validFrom,
      validTo,
      recipientName,
      phoneNumber,
      minimumOrderAmount,
      maximumDiscount,
      notes
    } = payload;
    const { userId } = req.auth.credentials as { userId: string };

    const input: IssueVoucherInput = { 
      eventId, 
      userId, 
      issueTo,
      name,
      description,
      type,
      value,
      usageLimit,
      validFrom,
      validTo,
      recipientName,
      phoneNumber,
      minimumOrderAmount,
      maximumDiscount,
      notes
    };
    const { code } = await VoucherService.issueVoucher(input);

    return formatSuccess(h, { code }, 'Voucher issued successfully');
  } catch (err) {
    return formatError(h, err);
  }
};
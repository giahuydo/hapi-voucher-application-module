import { Request, ResponseToolkit } from '@hapi/hapi';
import * as VoucherService from '../voucher.service';
import { IssueVoucherInput } from '../dto/voucher.input';
import { formatSuccess, formatError } from '../../../../utils/responseFormatter';

/**
 * Get all vouchers
 */
export const getAllVouchers = async (_req: Request, h: ResponseToolkit) => {
  try {
    const vouchers = await VoucherService.getAllVouchers();
    return h.response({
      success: true,
      message: 'Fetched all vouchers successfully',
      data: vouchers,
    });
  } catch (err: any) {
    return h.response({
      success: false,
      message: err.message || 'Internal server error',
    }).code(500);
  }
};

/**
 * Get voucher by ID
 */
export const getVoucherById = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const voucher = await VoucherService.getVoucherById(id);

    if (!voucher) {
      return h.response({
        success: false,
        message: 'Voucher not found',
      }).code(404);
    }

    return h.response({
      success: true,
      message: 'Voucher found',
      data: voucher,
    });
  } catch (err: any) {
    return h.response({
      success: false,
      message: err.message || 'Internal server error',
    }).code(500);
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
 * Issue a new voucher for an event
 */
export const requestVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params as { eventId: string };
    const { userId } = req.auth.credentials as { userId: string };

    const input: IssueVoucherInput = { eventId, userId };
    const { code } = await VoucherService.issueVoucher(input);
    
    return h.response({
      success: true,
      message: 'Voucher issued successfully',
      data: { code }
    });

  } catch (err: any) {
    return h.response({
      success: false,
      message: err.message || 'Internal server error',
    }).code(500);
  }
};
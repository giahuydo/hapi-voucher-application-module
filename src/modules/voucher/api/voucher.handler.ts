import { Request, ResponseToolkit } from '@hapi/hapi';
import * as VoucherService from '../voucher.service';
import { IssueVoucherInput } from '../dto/voucher.input';
import { formatSuccess, formatError } from '../../../../utils/responseFormatter';

/**
 * Get all vouchers
 */
export const getAllVouchers = async (_req: Request, h: ResponseToolkit) => {
  try {
    const vouchers = await VoucherService.getAllVouchers(_req.query);
    return formatSuccess(h, vouchers, 'Fetched all vouchers successfully');
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
 * Issue a new voucher for an event
 */
export const requestVoucher = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params as { eventId: string };
    const { userId } = req.auth.credentials as { userId: string };

    const input: IssueVoucherInput = { eventId, userId };
    const { code } = await VoucherService.issueVoucher(input);

    return formatSuccess(h, { code }, 'Voucher issued successfully');
  } catch (err) {
    return formatError(h, err);
  }
};
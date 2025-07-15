import { VoucherDocument } from './voucher.model';
import { VoucherDTO } from './dto/voucher.dto';

/**
 * Transforms a Mongoose VoucherDocument into a safe VoucherDTO for client response.
 */
export function transformVoucher(voucher: VoucherDocument): VoucherDTO {
  return {
    id: (voucher._id as string).toString(),
    eventId: voucher.eventId.toString(),
    issuedTo: voucher.issuedTo.toString(),
    code: voucher.code,
    isUsed: voucher.isUsed,
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
  };
}

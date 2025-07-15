import { VoucherDTO } from "./dto/voucher.dto";
import { VoucherDocument } from "./voucher.model";

/**
 * Transforms a Mongoose VoucherDocument into a safe VoucherDTO for client response.
 */
export function transformVoucher(voucher: VoucherDocument): VoucherDTO {
  return {
    id: (voucher._id as string).toString(),
    eventId: voucher.eventId.toString(),
    code: voucher.code,
    issuedTo: voucher.issuedTo.toString(),
    isUsed: voucher.isUsed,
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
  };
}

/**
 * Transforms a list of VoucherDocuments into an array of VoucherDTOs.
 */
export function transformVoucherList(vouchers: VoucherDocument[]): VoucherDTO[] {
  return vouchers.map(transformVoucher);
}

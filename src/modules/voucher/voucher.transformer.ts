import { VoucherDTO } from "./dto/voucher.dto";
import { VoucherDocument } from "./voucher.model";
import { Types } from 'mongoose';

type ObjectIdLike = string | Types.ObjectId;

type VoucherInput = Partial<{
  _id: ObjectIdLike;
  eventId: ObjectIdLike;
  issuedTo: ObjectIdLike;
  code: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;


/**
 * Transforms a Mongoose VoucherDocument into a safe VoucherDTO for client response.
 */
export function transformVoucher(input: VoucherDocument | VoucherInput): VoucherDTO {
  return {
    id: input._id?.toString?.() ?? '',
    eventId: input.eventId?.toString?.() ?? '',
    code: input.code ?? '',
    issuedTo: input.issuedTo?.toString?.() ?? '',
    isUsed: input.isUsed ?? false,
    createdAt: input.createdAt ?? new Date(0),
    updatedAt: input.updatedAt ?? new Date(0),
  };
}


/**
 * Transforms a list of VoucherDocuments into an array of VoucherDTOs.
 */
export function transformVoucherList(inputs: (VoucherDocument | VoucherInput)[]): VoucherDTO[] {
  return inputs.map(transformVoucher);
}

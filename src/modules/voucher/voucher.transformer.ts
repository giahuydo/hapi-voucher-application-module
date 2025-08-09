import { VoucherDTO } from "./dto/voucher.dto";
import { VoucherDocument } from "./voucher.model";
import { Types } from 'mongoose';

type ObjectIdLike = string | Types.ObjectId;

type PopulatedEvent = {
  _id: ObjectIdLike;
  name: string;
  description?: string;
  maxQuantity: number;
  issuedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type VoucherInput = Partial<{
  _id: ObjectIdLike;
  eventId: ObjectIdLike | PopulatedEvent;
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
  const isPopulated = input.eventId && typeof input.eventId === 'object' && '_id' in input.eventId;
  const populatedEvent = isPopulated ? input.eventId as PopulatedEvent : null;
  
  return {
    id: input._id?.toString?.() ?? '',
    eventId: isPopulated ? populatedEvent!._id.toString() : input.eventId?.toString?.() ?? '',
    code: input.code ?? '',
    issuedTo: input.issuedTo?.toString?.() ?? '',
    isUsed: input.isUsed ?? false,
    createdAt: input.createdAt ?? new Date(0),
    updatedAt: input.updatedAt ?? new Date(0),
    // Event information from populate if available
    event: isPopulated ? {
      id: populatedEvent!._id.toString(),
      name: populatedEvent!.name,
      description: populatedEvent!.description,
      maxQuantity: populatedEvent!.maxQuantity,
      issuedCount: populatedEvent!.issuedCount,
      isActive: populatedEvent!.isActive,
      createdAt: populatedEvent!.createdAt,
      updatedAt: populatedEvent!.updatedAt,
    } : undefined,
  };
}

/**
 * Transforms a list of VoucherDocuments into an array of VoucherDTOs.
 */
export function transformVoucherList(inputs: (VoucherDocument | VoucherInput)[]): VoucherDTO[] {
  return inputs.map(transformVoucher);
}

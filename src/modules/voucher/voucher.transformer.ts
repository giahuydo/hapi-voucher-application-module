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
  // Voucher specific fields
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  usedCount?: number;
  usageLimit?: number;
  isActive?: boolean;
  // Date fields (consolidated)
  validFrom?: Date;    // When voucher becomes valid
  validTo?: Date;      // When voucher expires
  // Additional fields for CreateVoucherRequest
  recipientName?: string;
  phoneNumber?: string;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  notes?: string;
}>;

/**
 * Transforms a Mongoose VoucherDocument into a safe VoucherDTO for client response.
 */
export function transformVoucher(input: VoucherDocument | VoucherInput): VoucherDTO {
  const isPopulated = input.eventId && typeof input.eventId === 'object' && '_id' in input.eventId;
  const populatedEvent = isPopulated ? input.eventId as PopulatedEvent : null;
  
  // Calculate voucher status
  const now = new Date();
  let status: 'available' | 'used' | 'expired' | 'inactive' = 'available';
  
  if (input.isUsed) {
    status = 'used';
  } else if (!input.isActive) {
    status = 'inactive';
  } else if (input.validTo && new Date(input.validTo) < now) {
    status = 'expired';
  }
  
  return {
    id: input._id?.toString?.() ?? '',
    eventId: isPopulated ? populatedEvent!._id.toString() : input.eventId?.toString?.() ?? '',
    code: input.code ?? '',
    issuedTo: input.issuedTo?.toString?.() ?? '',
    isUsed: input.isUsed ?? false,
    createdAt: input.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: input.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    // Voucher specific fields
    name: input.name,
    description: input.description,
    type: input.type,
    value: input.value,
    usedCount: input.usedCount,
    usageLimit: input.usageLimit,
    isActive: input.isActive,
    // Date fields (consolidated)
    validFrom: input.validFrom?.toISOString(),
    validTo: input.validTo?.toISOString(),
    // Additional fields for CreateVoucherRequest
    recipientName: input.recipientName,
    phoneNumber: input.phoneNumber,
    minimumOrderAmount: input.minimumOrderAmount,
    maximumDiscount: input.maximumDiscount,
    notes: input.notes,
    // Computed status field
    status: status,
    // Event information from populate if available
    event: isPopulated ? {
      id: populatedEvent!._id.toString(),
      name: populatedEvent!.name,
      description: populatedEvent!.description || '',
      maxQuantity: populatedEvent!.maxQuantity,
      issuedCount: populatedEvent!.issuedCount,
      isActive: populatedEvent!.isActive,
      createdAt: populatedEvent!.createdAt?.toISOString() ?? new Date(0).toISOString(),
      updatedAt: populatedEvent!.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    } : {
      id: '',
      name: '',
      description: '',
      maxQuantity: 0,
      issuedCount: 0,
      isActive: false,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
  };
}

/**
 * Transforms a list of VoucherDocuments into an array of VoucherDTOs.
 */
export function transformVoucherList(inputs: (VoucherDocument | VoucherInput)[]): VoucherDTO[] {
  return inputs.map(transformVoucher);
}

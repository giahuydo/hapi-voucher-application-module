// src/modules/voucher/voucher.core.ts
import mongoose from "mongoose";
import { Voucher } from "./voucher.model";
import { Event } from "../event/event.model";
import { generateVoucherCode } from "../../../utils/generateVoucherCode";
import {
  AppError,
  NotFoundError,
  ValidationError,
} from "../../../utils/errorHandler";

/**
 * Pure business logic: issue voucher
 * No side effects - only creates voucher and updates event
 */
export const issueVoucherCore = async (
  eventId: string,
  userId: string,
  session: mongoose.ClientSession,
  voucherData?: {
    name?: string;
    description?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    usageLimit?: number;
    // Date fields (consolidated)
    validFrom?: Date;    // When voucher becomes valid
    validTo?: Date;      // When voucher expires
    // Additional fields for CreateVoucherRequest
    recipientName?: string;
    phoneNumber?: string;
    minimumOrderAmount?: number;
    maximumDiscount?: number;
    notes?: string;
  }
): Promise<string> => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ValidationError("Invalid event ID format");
  }

  const event = await Event.findById(eventId).session(session);
  if (!event) throw new NotFoundError("Event not found");

  if (event.issuedCount >= event.maxQuantity) {
    throw new AppError("Voucher has been exhausted", 456);
  }

  const code = generateVoucherCode();

  await Voucher.create(
    [
      {
        eventId: event._id,
        code,
        issuedTo: userId,
        isUsed: false,
        // Voucher specific fields
        name: voucherData?.name,
        description: voucherData?.description,
        type: voucherData?.type || 'fixed',
        value: voucherData?.value,
        usedCount: 0,
        usageLimit: voucherData?.usageLimit,
        isActive: true,
        // Date fields (consolidated)
        validFrom: voucherData?.validFrom,
        validTo: voucherData?.validTo,
        // Additional fields for CreateVoucherRequest
        recipientName: voucherData?.recipientName,
        phoneNumber: voucherData?.phoneNumber,
        minimumOrderAmount: voucherData?.minimumOrderAmount,
        maximumDiscount: voucherData?.maximumDiscount,
        notes: voucherData?.notes,
      },
    ],
    { session }
  );

  event.issuedCount += 1;
  await event.save({ session });

  return code;
};
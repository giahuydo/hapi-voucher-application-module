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
 * No email, no log
 */
export const issueVoucherCore = async (
  eventId: string,
  userId: string,
  session: mongoose.ClientSession
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
      },
    ],
    { session }
  );

  event.issuedCount += 1;
  await event.save({ session });

  return code;
};
import mongoose from "mongoose";
import { Voucher } from "./voucher.model";
import { transformVoucher } from "./voucher.transformer";
import { VoucherDTO } from "./dto/voucher.dto";
import { IssueVoucherInput } from "./dto/voucher.input";
import { Event } from "../event/event.model";
import * as UserService from "../user/user.service";
import emailQueue from "../../../jobs/queues/email.queue";
import { generateVoucherCode } from "../../../utils/generateVoucherCode";
import logger from "../../../utils/logger";
import {
  AppError,
  NotFoundError,
  ValidationError,
} from "../../../utils/errorHandler";

export const issueVoucherCore = async (
  eventId: string,
  userId: string,
  session: mongoose.ClientSession
): Promise<string> => {
  logger.info('[issueVoucherCore] 🔍 Validate eventId');
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ValidationError("Invalid event ID format");
  }

  logger.info(`[issueVoucherCore] 🔍 Finding event: ${eventId}`);
  const event = await Event.findById(eventId).session(session);
  if (!event) throw new NotFoundError("Event not found");

  logger.info(`[issueVoucherCore] 🎯 Event found: ${event.name}`);
  if (event.issuedCount >= event.maxQuantity) {
    throw new AppError("Voucher has been exhausted", 456);
  }

  const code = generateVoucherCode();
  logger.info(`[issueVoucherCore] 🏷️ Generated code: ${code}`);

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
  logger.info(`[issueVoucherCore] ✅ Voucher created in DB`);

  event.issuedCount += 1;
  await event.save({ session });
  logger.info(`[issueVoucherCore] 🧮 Event.issuedCount updated to ${event.issuedCount}`);

  return code;
};

export const issueVoucher = async (
  input: IssueVoucherInput,
  retryCount = 0
): Promise<{ code: string }> => {
  logger.info(`[issueVoucher] 🚀 Starting voucher issue attempt #${retryCount + 1}`);
  const session = await mongoose.startSession();
  let committed = false;

  try {
    session.startTransaction();
    logger.info('[issueVoucher] 🔒 Transaction started');

    const code = await issueVoucherCore(input.eventId, input.userId, session);
    
    await session.commitTransaction();
    committed = true;
    logger.info('[issueVoucher] ✅ Transaction committed');

    await sendVoucherEmail(input.userId, code);

    return { code };
  } catch (err: any) {
    if (!committed) {
      await session.abortTransaction();
      logger.warn('[issueVoucher] 🔁 Transaction aborted due to error');
    }

    const isTransient =
      err?.name === "TransientTransactionError" ||
      err?.name === "WriteConflict" ||
      err?.message?.includes("WriteConflict");

    if (isTransient && retryCount < 3) {
      logger.warn('[issueVoucher] 🔁 Transient error, retrying...');
      return await issueVoucher(input, retryCount + 1);
    }

    logger.error('[issueVoucher] ❌ Error issuing voucher', err);
    throw err;
  } finally {
    session.endSession();
    logger.info('[issueVoucher] 🔚 Session ended');
  }
};
export const sendVoucherEmail = async (userId: string, code: string) => {
  logger.info(`[sendVoucherEmail] 📧 Preparing to send to user ${userId}`);
  const user = await UserService.getUserById(userId);
  if (user?.email) {
    logger.info(`[sendVoucherEmail] 📤 Sending to ${user.email} with code ${code}`);
    await emailQueue.add({ to: user.email, code });
    logger.info(`[sendVoucherEmail] ✅ Queued email successfully`);
  } else {
    logger.warn(`[sendVoucherEmail] ⚠️ User ${userId} has no email`);
  }
};
export const getAllVouchers = async (): Promise<VoucherDTO[]> => {
  const vouchers = await Voucher.find().lean();
  return vouchers.map(transformVoucher);
};

export const getVoucherById = async (
  id: string
): Promise<VoucherDTO | null> => {
  const voucher = await Voucher.findById(id).lean();
  return voucher ? transformVoucher(voucher) : null;
};

export const markVoucherAsUsed = async (
  id: string
): Promise<{ code: number; message: string }> => {
  const voucher = await Voucher.findById(id);
  if (!voucher) return { code: 404, message: "Voucher not found" };
  if (voucher.isUsed) return { code: 409, message: "Voucher already used" };

  voucher.isUsed = true;
  await voucher.save();

  return { code: 200, message: "Voucher marked as used" };
};

export const getVouchersByEventId = async (
  eventId: string
): Promise<VoucherDTO[]> => {
  const vouchers = await Voucher.find({ eventId }).lean();
  return vouchers.map(transformVoucher);
};

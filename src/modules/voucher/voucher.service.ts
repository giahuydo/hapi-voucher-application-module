import mongoose from "mongoose";
import { Voucher } from "./voucher.model";
import { transformVoucher } from "./voucher.transformer";
import { VoucherDTO } from "./dto/voucher.dto";
import { IssueVoucherInput } from "./dto/voucher.input";
import * as UserService from "../user/user.service";
import emailQueue from "../../../jobs/queues/email.queue";
import {logger} from "../../../utils/logger";
import {NotFoundError} from "../../../utils/errorHandler";
import { createError } from  "../../../utils/errorHandler";
import { issueVoucherCore } from "./voucher.core";
import { PaginationQuery, paginateModel } from "../../../utils/PaginationQuery";

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

export const getAllVouchers = (query: PaginationQuery) =>
  paginateModel({
    model: Voucher,
    query,
    transform: transformVoucher,
    searchableFields: ['code', 'issuedTo'],
  });

export const getVoucherById = async (id: string): Promise<VoucherDTO> => {
  const voucher = await Voucher.findById(id).lean();
  if (!voucher) throw new NotFoundError('Voucher not found');
  return transformVoucher(voucher);
};

export const markVoucherAsUsed = async (
  id: string
): Promise<VoucherDTO> => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new NotFoundError('Voucher not found');
  if (voucher.isUsed) throw createError('ConflictError', 'Voucher already used', 409);

  voucher.isUsed = true;
  const saved = await voucher.save();

  return transformVoucher(saved);
};

export const releaseVoucher = async (id: string): Promise<VoucherDTO> => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new NotFoundError('Voucher not found');
  if (!voucher.isUsed) throw createError('BadRequest', 'Voucher is already unused', 400);

  voucher.isUsed = false;
  await voucher.save();

  return transformVoucher(voucher);
};

export const getVouchersByEventId = async (
  eventId: string
): Promise<VoucherDTO[]> => {
  const vouchers = await Voucher.find({ eventId }).lean();
  return vouchers.map(transformVoucher);
};

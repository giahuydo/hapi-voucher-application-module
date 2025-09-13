import mongoose from "mongoose";
import { Voucher } from "./voucher.model";
import { Event } from "../event/event.model";
import { transformVoucher, transformVoucherList } from "./voucher.transformer";
import { VoucherDTO } from "./dto/voucher.dto";
import { IssueVoucherInput } from "./dto/voucher.input";
import * as UserService from "../user/user.service";
import emailQueue from "../../../jobs/queues/email.queue";
import {logger} from "../../../utils/logger";
import {NotFoundError, createError} from "../../../utils/errorHandler";
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

    // issueVoucherCore already creates the voucher and returns the code
    const code = await issueVoucherCore(input.eventId, input.userId, session);
    
    await session.commitTransaction();
    committed = true;
    logger.info('[issueVoucher] ✅ Transaction committed');

    // Send voucher notification email directly via email queue
    await sendVoucherNotificationEmail(input.userId, code);

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

export const sendVoucherNotificationEmail = async (userId: string, code: string) => {
  logger.info(`[sendVoucherNotificationEmail] 📧 Sending voucher notification email for user ${userId}`);
  
  try {
    const user = await UserService.getUserById(userId);
    if (user?.email) {
      logger.info(`[sendVoucherNotificationEmail] 📧 Queuing email for ${user.email} with code ${code}`);
      
      // Add email job to email queue
      await emailQueue.add('send-voucher-email', {
        to: user.email,
        code: code
      });
      
      logger.info(`[sendVoucherNotificationEmail] ✅ Email job queued successfully for ${user.email}`);
    } else {
      logger.warn(`[sendVoucherNotificationEmail] ⚠️ User ${userId} has no email - no email sent`);
    }
  } catch (error) {
    // Don't fail the main operation if email queuing fails
    logger.error(`[sendVoucherNotificationEmail] ❌ Failed to queue email for user ${userId}:`, error);
  }
};

export const getAllVouchers = async (query: PaginationQuery) => {
  // Custom pagination with event population to demonstrate collection linking
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', searchFields = {} } = query;
  
  // Build filter conditions
  const filter: any = {};
  if (searchFields.eventId) filter.eventId = searchFields.eventId;
  if (searchFields.issuedTo) filter.issuedTo = searchFields.issuedTo;
  if (searchFields.code) filter.code = { $regex: searchFields.code, $options: 'i' };
  if (searchFields.isUsed !== undefined) filter.isUsed = searchFields.isUsed;

  // Calculate skip
  const skip = (page - 1) * limit;

  // Build sort
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get vouchers with event population - demonstrating collection linking
  const vouchers = await Voucher.find(filter)
    .populate('eventId', 'name description maxQuantity issuedCount isActive createdAt updatedAt')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const total = await Voucher.countDocuments(filter);

  // Use transformer to convert to DTOs
  const transformedVouchers = transformVoucherList(vouchers);

  return {
    data: transformedVouchers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

export const getVoucherById = async (id: string): Promise<VoucherDTO> => {
  // Get voucher with populated event data - demonstrating collection linking
  const voucher = await Voucher.findById(id)
    .populate('eventId', 'name description maxQuantity issuedCount isActive createdAt updatedAt')
    .lean();
    
  if (!voucher) throw new NotFoundError('Voucher not found');
  
  // Use transformer to convert to DTO
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

  // Use transformer to convert to DTO
  return transformVoucher(saved);
};

export const releaseVoucher = async (id: string): Promise<VoucherDTO> => {
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new NotFoundError('Voucher not found');
  if (!voucher.isUsed) throw createError('BadRequest', 'Voucher is already unused', 400);

  voucher.isUsed = false;
  const saved = await voucher.save();

  // Use transformer to convert to DTO
  return transformVoucher(saved);
};

export const getVouchersByEventId = async (
  eventId: string
): Promise<VoucherDTO[]> => {
  logger.info(`[getVouchersByEventId] 🔍 Getting vouchers for event ${eventId}`);
  
  const vouchers = await Voucher.find({ eventId })
    .populate('eventId', 'name description maxQuantity issuedCount isActive createdAt updatedAt')
    .lean();

  const transformedVouchers = transformVoucherList(vouchers);
  logger.info(`[getVouchersByEventId] ✅ Found ${transformedVouchers.length} vouchers`);
  
  return transformedVouchers;
};

export const deleteVoucher = async (id: string): Promise<{ message: string }> => {
  logger.info(`[deleteVoucher] 🗑️ Attempting to delete voucher ${id}`);
  
  // Check if voucher exists
  const voucher = await Voucher.findById(id);
  if (!voucher) {
    logger.warn(`[deleteVoucher] ⚠️ Voucher ${id} not found`);
    throw new NotFoundError(`Voucher with ID ${id} not found`);
  }

  // Check if voucher is used (optional business rule)
  if (voucher.isUsed) {
    logger.warn(`[deleteVoucher] ⚠️ Cannot delete used voucher ${id}`);
    throw createError('ConflictError', 'Cannot delete a voucher that has been used', 409);
  }

  // Delete the voucher
  const deletedVoucher = await Voucher.findByIdAndDelete(id);
  if (!deletedVoucher) {
    logger.error(`[deleteVoucher] ❌ Failed to delete voucher ${id}`);
    throw createError('InternalServerError', 'Failed to delete voucher', 500);
  }

  logger.info(`[deleteVoucher] ✅ Successfully deleted voucher ${id}`);
  return { message: 'Voucher deleted successfully' };
};



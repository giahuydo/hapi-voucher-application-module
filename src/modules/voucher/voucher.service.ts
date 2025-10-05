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

    // Prepare voucher data
    const voucherData = {
      name: input.name,
      description: input.description,
      type: input.type,
      value: input.value,
      usageLimit: input.usageLimit,
      // Date fields (consolidated)
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validTo: input.validTo ? new Date(input.validTo) : undefined,
      // Additional fields for CreateVoucherRequest
      recipientName: input.recipientName,
      phoneNumber: input.phoneNumber,
      minimumOrderAmount: input.minimumOrderAmount,
      maximumDiscount: input.maximumDiscount,
      notes: input.notes,
    };

    // issueVoucherCore already creates the voucher and returns the code
    const code = await issueVoucherCore(input.eventId, input.userId, session, voucherData);
    
    await session.commitTransaction();
    committed = true;
    logger.info('[issueVoucher] ✅ Transaction committed');

    // Send voucher notification email directly via email queue
    await sendVoucherNotificationEmail(input.issueTo, code, input.eventId, input.userId, voucherData);

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

export const sendVoucherNotificationEmail = async (email: string, code: string, eventId: string, userId: string, voucherDetails?: any) => {
  logger.info(`[sendVoucherNotificationEmail] 📧 Sending voucher notification email to ${email}`);
  
  try {
    if (email) {
      logger.info(`[sendVoucherNotificationEmail] 📧 Queuing email for ${email} with code ${code}`);
      
      // Get full voucher data for email template
      const voucherData = await getVoucherDataForEmail(eventId, userId, code);
      
      // Override the 'to' field with the issueTo email
      voucherData.to = email;
      
      // Override with actual voucher details if provided
      if (voucherDetails) {
        voucherData.recipientName = voucherDetails.recipientName;
        voucherData.phoneNumber = voucherDetails.phoneNumber;
        voucherData.type = voucherDetails.type;
        voucherData.value = voucherDetails.value;
        voucherData.usageLimit = voucherDetails.usageLimit;
        voucherData.minimumOrderAmount = voucherDetails.minimumOrderAmount;
        voucherData.maximumDiscount = voucherDetails.maximumDiscount;
        voucherData.validFrom = voucherDetails.validFrom;
        voucherData.validTo = voucherDetails.validTo;
        voucherData.notes = voucherDetails.notes;
      }
      
      // Add email job to email queue
      await emailQueue.add('send-voucher-email', voucherData);
      
      logger.info(`[sendVoucherNotificationEmail] ✅ Email job queued successfully for ${email}`);
    } else {
      logger.warn(`[sendVoucherNotificationEmail] ⚠️ No email provided - no email sent`);
    }
  } catch (error) {
    // Don't fail the main operation if email queuing fails
    logger.error(`[sendVoucherNotificationEmail] ❌ Failed to queue email for ${email}:`, error);
  }
};

/**
 * Get full voucher data for email template
 */
const getVoucherDataForEmail = async (eventId: string, userId: string, code: string) => {
  try {
    // Get event information
    const event = await Event.findById(eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }

    // Get user information
    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      to: user.email || '', // This will be overridden by issueTo
      code: code,
      email: user.email || '',
      name: user.name || user.email || 'User',
      voucherCode: code,
      eventName: event.name,
      eventDescription: event.description || 'No description available',
      // Additional voucher fields for email template
      recipientName: user.name,
      phoneNumber: (user as any).phoneNumber, // Cast to any since phoneNumber might not be in UserDTO
      type: 'fixed', // Default type, will be overridden by actual voucher data
      value: 0, // Default value, will be overridden by actual voucher data
      usageLimit: 1, // Default usage limit, will be overridden by actual voucher data
      minimumOrderAmount: undefined, // Will be overridden by actual voucher data
      maximumDiscount: undefined, // Will be overridden by actual voucher data
      validFrom: undefined, // Will be overridden by actual voucher data
      validTo: undefined, // Will be overridden by actual voucher data
      notes: undefined // Will be overridden by actual voucher data
    };
  } catch (error) {
    logger.error('[getVoucherDataForEmail] ❌ Error getting voucher data:', error);
    // Return minimal data if there's an error
    return {
      to: '',
      code: code,
      email: '',
      name: 'User',
      voucherCode: code,
      eventName: 'Event',
      eventDescription: 'No description available'
    };
  }
};

export const getAllVouchers = async (query: PaginationQuery) => {
  // Custom pagination with event population to demonstrate collection linking
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', searchFields = {}, search } = query;
  
  // Build filter conditions
  const filter: any = {};
  
  // Handle specific field filters
  if (searchFields.eventId) filter.eventId = searchFields.eventId;
  if (searchFields.issuedTo) filter.issuedTo = searchFields.issuedTo;
  if (searchFields.code) filter.code = { $regex: searchFields.code, $options: 'i' };
  if (searchFields.isUsed !== undefined) filter.isUsed = searchFields.isUsed;
  if (searchFields.type) filter.type = searchFields.type;
  if (searchFields.isActive !== undefined) filter.isActive = searchFields.isActive;
  
  // Handle status filter (computed field)
  if (searchFields.status) {
    const now = new Date();
    switch (searchFields.status) {
      case 'available':
        filter.isUsed = false;
        filter.isActive = true;
        filter.$or = [
          { validTo: { $exists: false } },
          { validTo: { $gt: now } }
        ];
        break;
      case 'used':
        filter.isUsed = true;
        break;
      case 'expired':
        filter.validTo = { $lt: now };
        break;
      case 'inactive':
        filter.isActive = false;
        break;
    }
  }
  
  // Handle date range filters
  if (searchFields.validFrom || searchFields.validTo) {
    filter.validFrom = {};
    if (searchFields.validFrom) filter.validFrom.$gte = new Date(searchFields.validFrom);
    if (searchFields.validTo) filter.validFrom.$lte = new Date(searchFields.validTo);
  }
  
  if (searchFields.createdFrom || searchFields.createdTo) {
    filter.createdAt = {};
    if (searchFields.createdFrom) filter.createdAt.$gte = new Date(searchFields.createdFrom);
    if (searchFields.createdTo) filter.createdAt.$lte = new Date(searchFields.createdTo);
  }
  
  // Handle global search across multiple fields
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    filter.$or = [
      { code: searchRegex },
      { name: searchRegex },
      { description: searchRegex },
      { recipientName: searchRegex },
      { notes: searchRegex }
    ];
  }

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

/**
 * Get filter options for vouchers (events, statuses, types)
 */
export const getVoucherFilterOptions = async () => {
  try {
    // Get all active events for dropdown
    const events = await Event.find({ isActive: true })
      .select('_id name description')
      .sort({ name: 1 })
      .lean();

    // Get unique voucher types
    const types = await Voucher.distinct('type', { type: { $exists: true } });

    // Get usage statistics
    const totalVouchers = await Voucher.countDocuments();
    const usedVouchers = await Voucher.countDocuments({ isUsed: true });
    const availableVouchers = await Voucher.countDocuments({ isUsed: false, isActive: true });
    const expiredVouchers = await Voucher.countDocuments({ 
      validTo: { $lt: new Date() } 
    });

    return {
      events: events.map(event => ({
        id: event._id.toString(),
        name: event.name,
        description: event.description
      })),
      types: types.filter(type => type !== null),
      statuses: [
        { value: 'available', label: 'Available', count: availableVouchers },
        { value: 'used', label: 'Used', count: usedVouchers },
        { value: 'expired', label: 'Expired', count: expiredVouchers },
        { value: 'inactive', label: 'Inactive', count: totalVouchers - availableVouchers - usedVouchers }
      ],
      statistics: {
        total: totalVouchers,
        available: availableVouchers,
        used: usedVouchers,
        expired: expiredVouchers
      }
    };
  } catch (error) {
    logger.error('[getVoucherFilterOptions] ❌ Error getting filter options:', error);
    throw createError('Failed to get filter options', '500');
  }
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



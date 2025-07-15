import mongoose from 'mongoose';
import { Voucher } from './voucher.model';
import { transformVoucher } from './voucher.transformer';
import { VoucherDTO } from './dto/voucher.dto';
import { IssueVoucherInput } from './dto/voucher.input';
import {Event} from '../event/event.model';
import * as UserService from '../user/user.service';
import emailQueue from '../../../jobs/queues/email.queue';
import logger from '../../../utils/logger';
import { AppError, NotFoundError, ValidationError } from '../../../utils/errorHandler';

export const issueVoucher = async (
  input: IssueVoucherInput
): Promise<{ code: string }> => {
  const { eventId, userId } = input;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new ValidationError('Invalid event ID format');
    }

    const event = await Event.findById(eventId).session(session);
    if (!event) throw new NotFoundError('Event not found');

    if (event.issuedCount >= event.maxQuantity) {
      throw new AppError('Voucher has been exhausted', 456);
    }

    const voucherCode = `VC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const [voucher] = await Voucher.create(
      [
        {
          eventId: event._id,
          code: voucherCode,
          issuedTo: userId,
          isUsed: false
        }
      ],
      { session }
    );

    event.issuedCount += 1;
    await event.save({ session });

    await session.commitTransaction();

    const user = await UserService.getUserById(userId);
    if (user?.email) {
      await emailQueue.add({ to: user.email, code: voucherCode });
    }

    return { code: voucherCode };
  } catch (error: any) {
    await session.abortTransaction();

    // Retry if transient
    if (
      error?.name === 'TransientTransactionError' ||
      error?.name === 'WriteConflict' ||
      error?.message?.includes('WriteConflict')
    ) {
      return await issueVoucher(input);
    }

    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllVouchers = async (): Promise<VoucherDTO[]> => {
  const vouchers = await Voucher.find();
  return vouchers.map(transformVoucher);
};

export const getVoucherById = async (id: string): Promise<VoucherDTO | null> => {
  const voucher = await Voucher.findById(id);
  return voucher ? transformVoucher(voucher) : null;
};

export const markVoucherAsUsed = async (
  id: string
): Promise<{ code: number; message: string }> => {
  const voucher = await Voucher.findById(id);
  if (!voucher) return { code: 404, message: 'Voucher not found' };
  if (voucher.isUsed) return { code: 409, message: 'Voucher already used' };

  voucher.isUsed = true;
  await voucher.save();

  return { code: 200, message: 'Voucher marked as used' };
};

export const getVouchersByEventId = async (
  eventId: string
): Promise<VoucherDTO[]> => {
  const vouchers = await Voucher.find({ eventId });
  return vouchers.map(transformVoucher);
};

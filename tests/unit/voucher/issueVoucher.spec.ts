import * as VoucherService from '../../../src/modules/voucher/voucher.service';
import * as UserService from '../../../src/modules/user/user.service';
import { Event } from '../../../src/modules/event/event.model';
import { Voucher } from '../../../src/modules/voucher/voucher.model';
import emailQueue from '../../../jobs/queues/email.queue';
import mongoose from 'mongoose';
import { generateVoucherCode } from '../../../utils/generateVoucherCode';
import { AppError } from '../../../utils/errorHandler';

const validEventId = new mongoose.Types.ObjectId().toHexString();

jest.mock('../../../src/modules/event/event.model');
jest.mock('../../../src/modules/voucher/voucher.model');
jest.mock('../../../src/modules/user/user.service');
jest.mock('../../../jobs/queues/email.queue', () => ({
  __esModule: true,
  default: { add: jest.fn() },
}));

jest.mock('../../../utils/generateVoucherCode', () => ({
  generateVoucherCode: jest.fn(),
}));

jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: jest.fn(),
}));

const createMockSession = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
});

const mockFindByIdWithSession = (model: any, returnedData: any) => {
  (model.findById as jest.Mock).mockReturnValue({
    session: jest.fn().mockResolvedValue(returnedData),
  });
};

describe('VoucherService.issueVoucher', () => {
  let session: any;
  const userId = 'user1';
  let eventId: string;
  const genCode = generateVoucherCode as jest.Mock;

  beforeEach(() => {
    session = createMockSession();
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    eventId = new mongoose.Types.ObjectId().toHexString();

    genCode.mockReset();
    (UserService.getUserById as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
    (emailQueue.add as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => jest.clearAllMocks());

  it('should issue voucher if event has quantity left', async () => {
    const mockEvent = {
      _id: eventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    genCode.mockReturnValue('VOUCHER123');

    const result = await VoucherService.issueVoucher({ eventId, userId });

    expect(result.code).toBe('VOUCHER123');
    expect(session.startTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(mockEvent.save).toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalledWith('send-voucher-email', {
      to: 'test@example.com',
      code: 'VOUCHER123',
    });
  });

  it('should throw 456 if event is out of vouchers', async () => {
    const mockEvent = {
      _id: eventId,
      maxQuantity: 3,
      issuedCount: 3,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    genCode.mockReturnValue('EXHAUSTED');

    try {
      await VoucherService.issueVoucher({ eventId, userId });
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(456);
    }

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(Voucher.create).not.toHaveBeenCalled();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('should retry transaction on transient error and succeed', async () => {
    const mockEvent = {
      _id: eventId,
      maxQuantity: 5,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    genCode.mockReturnValueOnce('FAIL-CODE').mockReturnValueOnce('RETRY-VCH');

    (Voucher.create as jest.Mock)
      .mockRejectedValueOnce({ name: 'TransientTransactionError' })
      .mockResolvedValueOnce([{ code: 'RETRY-VCH' }]);

    const result = await VoucherService.issueVoucher({ eventId, userId });

    expect(result.code).toBe('RETRY-VCH');
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(Voucher.create).toHaveBeenCalledTimes(2);
    expect(emailQueue.add).toHaveBeenCalledWith('send-voucher-email', {
      to: 'test@example.com',
      code: 'RETRY-VCH',
    });
  });

  it('should only issue up to maxQuantity vouchers even with concurrent requests', async () => {
    let issuedCount = 0;

    const eventMock = {
      _id: validEventId,
      maxQuantity: 1,
      get issuedCount() {
        return issuedCount;
      },
      set issuedCount(value) {
        issuedCount = value;
      },
      save: jest.fn().mockResolvedValue(true),
    };

    mockFindByIdWithSession(Event, eventMock);
    genCode.mockImplementation(() => `VOUCHER${issuedCount + 1}`);

    (Voucher.create as jest.Mock).mockImplementation(() => {
      issuedCount++;
      return Promise.resolve([{ code: `VOUCHER${issuedCount}` }]);
    });

    const requests = [
      VoucherService.issueVoucher({ eventId: validEventId, userId: 'u1' }),
      VoucherService.issueVoucher({ eventId: validEventId, userId: 'u2' }),
      VoucherService.issueVoucher({ eventId: validEventId, userId: 'u3' }),
    ];

    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);

    rejected.forEach((r) => {
      const error = r.status === 'rejected' ? r.reason : null;
      expect(error).toBeInstanceOf(AppError);
      expect(error?.statusCode).toBe(456);
    });
  });

  it('should throw NotFoundError if event does not exist', async () => {
    mockFindByIdWithSession(Event, null);

    await expect(
      VoucherService.issueVoucher({ eventId: validEventId, userId: 'u1' })
    ).rejects.toThrow(expect.objectContaining({ message: 'Event not found' }));

    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('should issue voucher but not send email if user has no email', async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 5,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    genCode.mockReturnValue('NOEMAIL456');
    (UserService.getUserById as jest.Mock).mockResolvedValue({ email: null });
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: 'NOEMAIL456' }]);

    const result = await VoucherService.issueVoucher({
      eventId: validEventId,
      userId: 'u1',
    });

    expect(result.code).toBe('NOEMAIL456');
    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});
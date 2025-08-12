import * as VoucherService from '../../../src/modules/voucher/voucher.service';
import * as UserService from '../../../src/modules/user/user.service';
import { Event } from '../../../src/modules/event/event.model';
import { Voucher } from '../../../src/modules/voucher/voucher.model';
import emailQueue from '../../../jobs/queues/email.queue';
import mongoose from 'mongoose';


// Mock models and modules
jest.mock('../../../src/modules/event/event.model');
jest.mock('../../../src/modules/voucher/voucher.model');
jest.mock('../../../src/modules/user/user.service', () => ({
  getUserById: jest.fn(),
}));
jest.mock('../../../jobs/queues/email.queue', () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
  },
}));


jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: jest.fn(),
}));

// Utilities
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


describe('VoucherService - issueVoucher', () => {
  let session: any;
  let validEventId: string;

  beforeEach(() => {
    session = createMockSession();
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    validEventId = new mongoose.Types.ObjectId().toHexString();

    // Default mock user
    (UserService.getUserById as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

    (emailQueue.add as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should issue voucher if event has quantity left', async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: 'VOUCHER123' }]);

    const result = await VoucherService.issueVoucher({ eventId: validEventId, userId: 'u1' });

    expect(result.code).toBe('VOUCHER123');
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalledWith({
      to: 'test@example.com',
      code: 'VOUCHER123',
    });
  });

  it('should throw 456 if event is out of vouchers', async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 1,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);

    await expect(
      VoucherService.issueVoucher({ eventId: validEventId, userId: 'u1' })
    ).rejects.toThrow(expect.objectContaining({ status: 456 }));

    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('should retry transaction on transient error', async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 3,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock)
      .mockRejectedValueOnce({ name: 'TransientTransactionError' })
      .mockResolvedValueOnce([{ code: 'RETRY456' }]);

    const result = await VoucherService.issueVoucher({ eventId: validEventId, userId: 'u1' });

    expect(result.code).toBe('RETRY456');
    expect(session.commitTransaction).toHaveBeenCalled();
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
      // @ts-ignore
      expect(r.reason.status).toBe(456);
    });
  });
});

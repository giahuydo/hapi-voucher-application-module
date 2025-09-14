import * as VoucherService from '../../../src/modules/voucher/voucher.service';
import * as UserService from '../../../src/modules/user/user.service';
import { Event } from '../../../src/modules/event/event.model';
import { Voucher } from '../../../src/modules/voucher/voucher.model';
import emailQueue from '../../../jobs/queues/email.queue';
import mongoose from 'mongoose';
import { generateVoucherCode } from '../../../utils/generateVoucherCode';
import { deleteVoucher } from '../../../src/modules/voucher/voucher.service';
import { NotFoundError } from '../../../utils/errorHandler';
import { sendVoucherNotificationEmail } from '../../../src/modules/voucher/voucher.service';

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
jest.mock('../../../utils/generateVoucherCode', () => ({
  generateVoucherCode: jest.fn(),
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

describe('issueVoucher', () => {
  let session: any;
  let validEventId: string;
  let genCode: jest.Mock;

  beforeEach(() => {
    session = createMockSession();
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    validEventId = new mongoose.Types.ObjectId().toHexString();

    // Default mock user
    (UserService.getUserById as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

    (emailQueue.add as jest.Mock).mockResolvedValue(true);
    
    // Setup generateVoucherCode mock
    genCode = generateVoucherCode as jest.Mock;
    genCode.mockReturnValue('VOUCHER123');
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
    expect(emailQueue.add).toHaveBeenCalledWith('send-voucher-email', {
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
    ).rejects.toThrow(expect.objectContaining({ statusCode: 456 }));

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
    genCode.mockReturnValueOnce('FAIL-CODE').mockReturnValueOnce('RETRY456');
    
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
      // @ts-ignore
      expect(r.reason.statusCode).toBe(456);
    });
  });
  
});

describe('deleteVoucher', () => {
  let mockVoucher: any;

  beforeEach(() => {
    mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: new mongoose.Types.ObjectId(),
      code: 'TEST123',
      issuedTo: 'user123',
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an unused voucher successfully', async () => {
    // Mock findById to return an unused voucher
    const findByIdSpy = jest.spyOn(Voucher, 'findById').mockResolvedValue(mockVoucher);
    
    // Mock findByIdAndDelete to return the deleted voucher
    const findByIdAndDeleteSpy = jest.spyOn(Voucher, 'findByIdAndDelete').mockResolvedValue(mockVoucher);

    const result = await deleteVoucher(mockVoucher._id.toString());

    expect(findByIdSpy).toHaveBeenCalledWith(mockVoucher._id.toString());
    expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(mockVoucher._id.toString());
    expect(result).toEqual({ message: 'Voucher deleted successfully' });
  });

  it('should throw NotFoundError when voucher does not exist', async () => {
    // Mock findById to return null
    jest.spyOn(Voucher, 'findById').mockResolvedValue(null);

    await expect(deleteVoucher('nonexistentid')).rejects.toThrow(NotFoundError);
    await expect(deleteVoucher('nonexistentid')).rejects.toThrow('Voucher with ID nonexistentid not found');
  });

  it('should throw ConflictError when trying to delete a used voucher', async () => {
    // Mock findById to return a used voucher
    const usedVoucher = { ...mockVoucher, isUsed: true };
    jest.spyOn(Voucher, 'findById').mockResolvedValue(usedVoucher);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Cannot delete a voucher that has been used');
  });

  it('should throw error when findByIdAndDelete fails', async () => {
    // Mock findById to return an unused voucher
    jest.spyOn(Voucher, 'findById').mockResolvedValue(mockVoucher);
    
    // Mock findByIdAndDelete to return null (deletion failed)
    jest.spyOn(Voucher, 'findByIdAndDelete').mockResolvedValue(null);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Failed to delete voucher');
  });

  it('should handle database errors gracefully', async () => {
    // Mock findById to throw a database error
    jest.spyOn(Voucher, 'findById').mockRejectedValue(new Error('Database connection error'));

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Database connection error');
  });
});

describe('sendVoucherNotificationEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should queue email job when user has email', async () => {
    const userId = 'user123';
    const code = 'TEST123';
    
    (UserService.getUserById as jest.Mock).mockResolvedValue({ 
      email: 'test@example.com' 
    });
    (emailQueue.add as jest.Mock).mockResolvedValue(true);

    await sendVoucherNotificationEmail(userId, code);

    expect(UserService.getUserById).toHaveBeenCalledWith(userId);
    expect(emailQueue.add).toHaveBeenCalledWith('send-voucher-email', {
      to: 'test@example.com',
      code: code
    });
  });

  it('should not queue email when user has no email', async () => {
    const userId = 'user123';
    const code = 'TEST123';
    
    (UserService.getUserById as jest.Mock).mockResolvedValue({ 
      email: null 
    });

    await sendVoucherNotificationEmail(userId, code);

    expect(UserService.getUserById).toHaveBeenCalledWith(userId);
    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});

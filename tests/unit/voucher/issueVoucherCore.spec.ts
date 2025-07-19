import mongoose from 'mongoose';
import { issueVoucherCore } from '../../../src/modules/voucher/voucher.core';
import { Event } from '../../../src/modules/event/event.model';
import { Voucher } from '../../../src/modules/voucher/voucher.model';
import { ValidationError, NotFoundError, AppError } from '../../../src/utils/errorHandler';

jest.mock('../../../src/modules/event/event.model');
jest.mock('../../../src/modules/voucher/voucher.model');

const createMockSession = () =>
    ({ startTransaction: jest.fn(), endSession: jest.fn() } as any);

// Helper mock
const mockFindByIdWithSession = (model: any, result: any) => {
    (model.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(result),
    });
};

describe('issueVoucherCore()', () => {
  const userId = 'user123';
  let eventId: string;
  let session: any;

  beforeEach(() => {
    session = createMockSession();
    eventId = new mongoose.Types.ObjectId().toHexString();
    jest.clearAllMocks();
  });

  it('❌ should throw ValidationError if eventId is invalid', async () => {
    await expect(
      issueVoucherCore('invalid-id', userId, session)
    ).rejects.toThrow(ValidationError);
  });

  it('❌ should throw NotFoundError if event not found', async () => {
    mockFindByIdWithSession(Event, null);

    await expect(issueVoucherCore(eventId, userId, session)).rejects.toThrow(NotFoundError);
  });

  it('❌ should throw AppError if issuedCount >= maxQuantity', async () => {
    const mockEvent = {
      _id: eventId,
      issuedCount: 5,
      maxQuantity: 5,
    };
    mockFindByIdWithSession(Event, mockEvent);

    await expect(issueVoucherCore(eventId, userId, session)).rejects.toThrow(AppError);
  });

  it('✅ should create voucher and increment issuedCount', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockEvent = {
      _id: eventId,
      issuedCount: 2,
      maxQuantity: 5,
      save: saveMock,
    };
    mockFindByIdWithSession(Event, mockEvent);

    (Voucher.create as jest.Mock).mockResolvedValue([{ code: 'VC-TESTCODE' }]);

    const code = await issueVoucherCore(eventId, userId, session);

    expect(code).toMatch(/^VC-[A-Z0-9]{9}$/);
    expect(Voucher.create).toHaveBeenCalledWith(
      [
        {
          eventId: mockEvent._id,
          code,
          issuedTo: userId,
          isUsed: false,
        },
      ],
      { session }
    );
    expect(mockEvent.issuedCount).toBe(3);
    expect(saveMock).toHaveBeenCalled();
  });
});
import * as VoucherService from "../../../src/modules/voucher/voucher.service";
import * as UserService from "../../../src/modules/user/user.service";
import { Event } from "../../../src/modules/event/event.model";
import { Voucher } from "../../../src/modules/voucher/voucher.model";
import emailQueue from "../../../jobs/queues/email.queue";
import mongoose from "mongoose";
import { generateVoucherCode } from "../../../utils/generateVoucherCode";
import { deleteVoucher } from "../../../src/modules/voucher/voucher.service";
import { NotFoundError } from "../../../utils/errorHandler";
import { sendVoucherNotificationEmail } from "../../../src/modules/voucher/voucher.service";
import { transformVoucher } from "../../../src/modules/voucher/voucher.transformer";
import Queue from "bull";

// Mock models and modules
jest.mock("../../../src/modules/event/event.model", () => ({
  Event: {
    findById: jest.fn(),
  },
}));
jest.mock("../../../src/modules/voucher/voucher.model");
jest.mock("../../../src/modules/user/user.service", () => ({
  getUserById: jest.fn(),
}));
jest.mock("../../../jobs/queues/email.queue", () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
  },
}));
jest.mock("../../../utils/generateVoucherCode", () => ({
  generateVoucherCode: jest.fn(),
}));

jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
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

describe("issueVoucher", () => {
  let session: any;
  let validEventId: string;
  let genCode: jest.Mock;

  beforeEach(() => {
    session = createMockSession();
    (mongoose.startSession as jest.Mock).mockResolvedValue(session);
    validEventId = new mongoose.Types.ObjectId().toHexString();

    // Default mock user
    (UserService.getUserById as jest.Mock).mockResolvedValue({
      email: "test@example.com",
    });

    (emailQueue.add as jest.Mock).mockResolvedValue(true);

    // Setup generateVoucherCode mock
    genCode = generateVoucherCode as jest.Mock;
    genCode.mockReturnValue("VOUCHER123");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should issue voucher if event has quantity left", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER123" }]);

    const result = await VoucherService.issueVoucher({
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
    });

    expect(result.code).toBe("VOUCHER123");
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(emailQueue.add).toHaveBeenCalledWith("send-voucher-email", expect.objectContaining({
      to: "test@example.com",
      code: "VOUCHER123",
      voucherCode: "VOUCHER123",
      name: expect.any(String),
      eventName: undefined, // Mock event doesn't have name property
      eventDescription: expect.any(String),
      email: "test@example.com"
    }));
  });

  it("should issue voucher with all new fields", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER123" }]);

    const voucherInput = {
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
      name: "Summer Sale Voucher",
      description: "20% off for summer event",
      type: "percentage" as const,
      value: 20,
      usageLimit: 5,
      validFrom: "2024-01-01T00:00:00.000Z",
      validTo: "2024-12-31T23:59:59.000Z",
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers"
    };

    const result = await VoucherService.issueVoucher(voucherInput);

    expect(result.code).toBe("VOUCHER123");
    expect(session.commitTransaction).toHaveBeenCalled();
    
    // Verify Voucher.create was called with all the new fields
    expect(Voucher.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        eventId: validEventId,
        code: "VOUCHER123",
        issuedTo: "u1",
        isUsed: false,
        name: "Summer Sale Voucher",
        description: "20% off for summer event",
        type: "percentage",
        value: 20,
        usedCount: 0,
        usageLimit: 5,
        isActive: true,
        validFrom: new Date("2024-01-01T00:00:00.000Z"),
        validTo: new Date("2024-12-31T23:59:59.000Z"),
        recipientName: "John Doe",
        phoneNumber: "+1234567890",
        minimumOrderAmount: 100,
        maximumDiscount: 50,
        notes: "Special voucher for VIP customers"
      })],
      { session }
    );

    expect(emailQueue.add).toHaveBeenCalledWith("send-voucher-email", expect.objectContaining({
      to: "test@example.com",
      code: "VOUCHER123",
      voucherCode: "VOUCHER123",
      name: expect.any(String),
      eventName: undefined, // Mock event doesn't have name property
      eventDescription: expect.any(String),
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      type: "percentage",
      value: 20,
      usageLimit: 5,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validTo: new Date("2024-12-31T23:59:59.000Z"),
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers"
    }));
  });

  it("should throw 456 if event is out of vouchers", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 1,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);

    await expect(
      VoucherService.issueVoucher({ eventId: validEventId, userId: "u1", issueTo: "test@example.com" })
    ).rejects.toThrow(expect.objectContaining({ statusCode: 456 }));

    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it("should retry transaction on transient error", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 3,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    genCode.mockReturnValueOnce("FAIL-CODE").mockReturnValueOnce("RETRY456");

    (Voucher.create as jest.Mock)
      .mockRejectedValueOnce({ name: "TransientTransactionError" })
      .mockResolvedValueOnce([{ code: "RETRY456" }]);

    const result = await VoucherService.issueVoucher({
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
    });

    expect(result.code).toBe("RETRY456");
    expect(session.commitTransaction).toHaveBeenCalled();
  });

  it("should only issue up to maxQuantity vouchers even with concurrent requests", async () => {
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
      VoucherService.issueVoucher({ eventId: validEventId, userId: "u1", issueTo: "test1@example.com" }),
      VoucherService.issueVoucher({ eventId: validEventId, userId: "u2", issueTo: "test2@example.com" }),
      VoucherService.issueVoucher({ eventId: validEventId, userId: "u3", issueTo: "test3@example.com" }),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);

    rejected.forEach((r) => {
      // @ts-ignore
      expect(r.reason.statusCode).toBe(456);
    });
  });

  it("should handle optional fields correctly", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER123" }]);

    // Test with minimal required fields only
    const minimalInput = {
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
    };

    const result = await VoucherService.issueVoucher(minimalInput);

    expect(result.code).toBe("VOUCHER123");
    expect(session.commitTransaction).toHaveBeenCalled();
    
    // Verify Voucher.create was called with default values for optional fields
    expect(Voucher.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        eventId: validEventId,
        code: "VOUCHER123",
        issuedTo: "u1",
        isUsed: false,
        name: undefined,
        description: undefined,
        type: "fixed", // Default type
        value: undefined,
        usedCount: 0,
        usageLimit: undefined,
        isActive: true,
        validFrom: undefined,
        validTo: undefined,
        recipientName: undefined,
        phoneNumber: undefined,
        minimumOrderAmount: undefined,
        maximumDiscount: undefined,
        notes: undefined
      })],
      { session }
    );
  });

  it("should handle date fields correctly", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER123" }]);

    const inputWithDates = {
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
      validFrom: "2024-01-01T00:00:00.000Z",
      validTo: "2024-12-31T23:59:59.000Z",
    };

    const result = await VoucherService.issueVoucher(inputWithDates);

    expect(result.code).toBe("VOUCHER123");
    
    // Verify dates are properly converted to Date objects
    expect(Voucher.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        validFrom: new Date("2024-01-01T00:00:00.000Z"),
        validTo: new Date("2024-12-31T23:59:59.000Z"),
      })],
      { session }
    );
  });

  it("should handle percentage and fixed voucher types", async () => {
    const mockEvent = {
      _id: validEventId,
      maxQuantity: 2,
      issuedCount: 1,
      save: jest.fn(),
    };

    mockFindByIdWithSession(Event, mockEvent);
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER123" }]);

    // Test percentage type
    const percentageInput = {
      eventId: validEventId,
      userId: "u1",
      issueTo: "test@example.com",
      type: "percentage" as const,
      value: 20,
    };

    await VoucherService.issueVoucher(percentageInput);

    expect(Voucher.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        type: "percentage",
        value: 20,
      })],
      { session }
    );

    // Reset mock and create a fresh event for the second test
    jest.clearAllMocks();
    (Voucher.create as jest.Mock).mockResolvedValue([{ code: "VOUCHER456" }]);
    
    const freshEventId = "68e20643c1b70a82c4a9514a";
    const mockFreshEvent = {
      _id: freshEventId,
      maxQuantity: 2,
      issuedCount: 0, // Fresh event with no issued vouchers
      save: jest.fn(),
    };
    mockFindByIdWithSession(Event, mockFreshEvent);

    // Test fixed type
    const fixedInput = {
      eventId: freshEventId,
      userId: "u1",
      issueTo: "test@example.com",
      type: "fixed" as const,
      value: 50,
    };

    await VoucherService.issueVoucher(fixedInput);

    expect(Voucher.create).toHaveBeenCalledWith(
      [expect.objectContaining({
        type: "fixed",
        value: 50,
      })],
      { session }
    );
  });
});

describe("transformVoucher", () => {
  it("should transform voucher with all new fields", () => {
    const mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: new mongoose.Types.ObjectId(),
      code: "VOUCHER123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      name: "Summer Sale Voucher",
      description: "20% off for summer event",
      type: "percentage" as const,
      value: 20,
      usedCount: 0,
      usageLimit: 5,
      isActive: true,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validTo: new Date("2024-12-31T23:59:59.000Z"),
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers"
    };

    const result = transformVoucher(mockVoucher);

    expect(result).toEqual({
      id: mockVoucher._id.toString(),
      eventId: mockVoucher.eventId.toString(),
      code: "VOUCHER123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      name: "Summer Sale Voucher",
      description: "20% off for summer event",
      type: "percentage",
      value: 20,
      usedCount: 0,
      usageLimit: 5,
      isActive: true,
      validFrom: "2024-01-01T00:00:00.000Z",
      validTo: "2024-12-31T23:59:59.000Z",
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers",
      event: {
        id: mockVoucher.eventId.toString(),
        name: undefined,
        description: "",
        maxQuantity: undefined,
        issuedCount: undefined,
        isActive: undefined,
        createdAt: '1970-01-01T00:00:00.000Z',
        updatedAt: '1970-01-01T00:00:00.000Z',
      }
    });
  });

  it("should transform voucher with populated event", () => {
    const mockPopulatedEvent = {
      _id: new mongoose.Types.ObjectId(),
      name: "Summer Festival",
      description: "Amazing summer event",
      maxQuantity: 100,
      issuedCount: 25,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    const mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: mockPopulatedEvent,
      code: "VOUCHER123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      name: "Summer Sale Voucher",
      type: "fixed" as const,
      value: 50,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validTo: new Date("2024-12-31T23:59:59.000Z"),
    };

    const result = transformVoucher(mockVoucher);

    expect(result.event).toEqual({
      id: mockPopulatedEvent._id.toString(),
      name: "Summer Festival",
      description: "Amazing summer event",
      maxQuantity: 100,
      issuedCount: 25,
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("should handle undefined optional fields", () => {
    const mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: new mongoose.Types.ObjectId(),
      code: "VOUCHER123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      // All optional fields are undefined
    };

    const result = transformVoucher(mockVoucher);

    expect(result).toEqual({
      id: mockVoucher._id.toString(),
      eventId: mockVoucher.eventId.toString(),
      code: "VOUCHER123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      name: undefined,
      description: undefined,
      type: undefined,
      value: undefined,
      usedCount: undefined,
      usageLimit: undefined,
      isActive: undefined,
      validFrom: undefined,
      validTo: undefined,
      recipientName: undefined,
      phoneNumber: undefined,
      minimumOrderAmount: undefined,
      maximumDiscount: undefined,
      notes: undefined,
      event: {
        id: mockVoucher.eventId.toString(),
        name: undefined,
        description: "",
        maxQuantity: undefined,
        issuedCount: undefined,
        isActive: undefined,
        createdAt: '1970-01-01T00:00:00.000Z',
        updatedAt: '1970-01-01T00:00:00.000Z',
      }
    });
  });
});

describe("deleteVoucher", () => {
  let mockVoucher: any;

  beforeEach(() => {
    mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: new mongoose.Types.ObjectId(),
      code: "TEST123",
      issuedTo: "user123",
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an unused voucher successfully", async () => {
    // Mock findById to return an unused voucher
    const findByIdSpy = jest
      .spyOn(Voucher, "findById")
      .mockResolvedValue(mockVoucher);

    // Mock findByIdAndDelete to return the deleted voucher
    const findByIdAndDeleteSpy = jest
      .spyOn(Voucher, "findByIdAndDelete")
      .mockResolvedValue(mockVoucher);

    const result = await deleteVoucher(mockVoucher._id.toString());

    expect(findByIdSpy).toHaveBeenCalledWith(mockVoucher._id.toString());
    expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(
      mockVoucher._id.toString()
    );
    expect(result).toEqual({ message: "Voucher deleted successfully" });
  });

  it("should throw NotFoundError when voucher does not exist", async () => {
    // Mock findById to return null
    jest.spyOn(Voucher, "findById").mockResolvedValue(null);

    await expect(deleteVoucher("nonexistentid")).rejects.toThrow(NotFoundError);
    await expect(deleteVoucher("nonexistentid")).rejects.toThrow(
      "Voucher with ID nonexistentid not found"
    );
  });

  it("should throw ConflictError when trying to delete a used voucher", async () => {
    // Mock findById to return a used voucher
    const usedVoucher = { ...mockVoucher, isUsed: true };
    jest.spyOn(Voucher, "findById").mockResolvedValue(usedVoucher);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow(
      "Cannot delete a voucher that has been used"
    );
  });

  it("should throw error when findByIdAndDelete fails", async () => {
    // Mock findById to return an unused voucher
    jest.spyOn(Voucher, "findById").mockResolvedValue(mockVoucher);

    // Mock findByIdAndDelete to return null (deletion failed)
    jest.spyOn(Voucher, "findByIdAndDelete").mockResolvedValue(null);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow(
      "Failed to delete voucher"
    );
  });

  it("should handle database errors gracefully", async () => {
    // Mock findById to throw a database error
    jest
      .spyOn(Voucher, "findById")
      .mockRejectedValue(new Error("Database connection error"));

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow(
      "Database connection error"
    );
  });
});

describe("sendVoucherNotificationEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should queue email job when email is provided", async () => {
    const email = "test@example.com";
    const code = "TEST123";
    const eventId = "event123";
    const userId = "user123";

    // Mock Event.findById
    (Event.findById as jest.Mock).mockResolvedValue({
      name: "Test Event",
      description: "Test Description"
    });

    (UserService.getUserById as jest.Mock).mockResolvedValue({
      email: "user@example.com",
      name: "Test User"
    });

    (emailQueue.add as jest.Mock).mockResolvedValue(true);

    await sendVoucherNotificationEmail(email, code, eventId, userId);

    expect(emailQueue.add).toHaveBeenCalledWith("send-voucher-email", expect.objectContaining({
      to: email,
      code: code,
      voucherCode: code,
      name: "Test User",
      eventName: "Test Event",
      eventDescription: "Test Description"
    }));
  });

  it("should queue email job with voucher details when provided", async () => {
    const email = "test@example.com";
    const code = "TEST123";
    const eventId = "event123";
    const userId = "user123";

    const voucherDetails = {
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      type: "percentage" as const,
      value: 20,
      usageLimit: 5,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validTo: new Date("2024-12-31T23:59:59.000Z"),
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers"
    };

    // Mock Event.findById
    (Event.findById as jest.Mock).mockResolvedValue({
      name: "Test Event",
      description: "Test Description"
    });

    (UserService.getUserById as jest.Mock).mockResolvedValue({
      email: "user@example.com",
      name: "Test User"
    });

    (emailQueue.add as jest.Mock).mockResolvedValue(true);

    await sendVoucherNotificationEmail(email, code, eventId, userId, voucherDetails);

    expect(emailQueue.add).toHaveBeenCalledWith("send-voucher-email", expect.objectContaining({
      to: email,
      code: code,
      voucherCode: code,
      name: "Test User",
      eventName: "Test Event",
      eventDescription: "Test Description",
      recipientName: "John Doe",
      phoneNumber: "+1234567890",
      type: "percentage",
      value: 20,
      usageLimit: 5,
      validFrom: new Date("2024-01-01T00:00:00.000Z"),
      validTo: new Date("2024-12-31T23:59:59.000Z"),
      minimumOrderAmount: 100,
      maximumDiscount: 50,
      notes: "Special voucher for VIP customers"
    }));
  });

  it("should not queue email when no email is provided", async () => {
    const email = "";
    const code = "TEST123";
    const eventId = "event123";
    const userId = "user123";

    await sendVoucherNotificationEmail(email, code, eventId, userId);

    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  const USE_REAL_REDIS = process.env.USE_REAL_REDIS === 'true';
  describe("Redis Queue (integration with voucher)", () => {
    let queue: Queue.Queue;

    beforeAll(async () => {
      queue = new Queue("emailQueue", process.env.REDIS_URL || "redis://127.0.0.1:6379");
      await queue.isReady();
      // Clear existing jobs
      await queue.obliterate({ force: true }).catch(() => {});
    }, 20000);

    afterAll(async () => {
      await queue.close();
    });

    it("should enqueue a voucher email job", async () => {
      const jobData = { to: "test@example.com", code: "VC-123" };
  
      await queue.add(jobData);
  
      const jobs = await queue.getWaiting();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].data).toEqual(jobData);
    }, 20000);
  

    it("should process a voucher email job", async () => {
      const jobData = { to: "user@example.com", code: "VC-999" };
  
      const processor = jest.fn(async (job) => {
        expect(job.data).toEqual(jobData);
        return { ok: true };
      });
  
      queue.process(processor);
      await queue.isReady();
  
      await queue.add(jobData);
  
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("Timed out waiting for completion")), 10000);
        queue.once("completed", () => { clearTimeout(t); resolve(); });
      });
  
      expect(processor).toHaveBeenCalledWith(expect.objectContaining({ data: jobData }));
  
      // Clean up jobs
      await queue.clean(0, "completed");
      await queue.clean(0, "failed");
    }, 30000);
  });
});

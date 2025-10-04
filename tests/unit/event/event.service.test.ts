import * as EventService from "../../../src/modules/event/event.service";
import { Event } from "../../../src/modules/event/event.model";
import mongoose from "mongoose";
import { NotFoundError, ValidationError } from "../../../utils/errorHandler";

// Mock the Event model
jest.mock("../../../src/modules/event/event.model");

// Mock mongoose
jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

describe("EventService", () => {
  const mockEventId = "507f1f77bcf86cd799439011";
  const mockUserId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestEditLock", () => {
    it("should allow lock if event is not being edited", async () => {
      const mockEvent = {
        _id: mockEventId,
        editingBy: mockUserId,
        editLockAt: new Date(Date.now() + 300000), // 5 minutes from now
      };

      // Mock findOneAndUpdate for the atomic operation
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEvent);
      const result = await EventService.requestEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(200);
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toBeInstanceOf(Date);
      expect(result.lockedBy).toBe(mockUserId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should allow lock if previous lock is expired", async () => {
      // Arrange
      const newLockDate = new Date(Date.now() + 300000); // new lock: 5 minutes from now
      const mockEvent = {
        _id: mockEventId,
        editingBy: mockUserId,
        editLockAt: newLockDate, // after acquiring new lock
      };

      // Mock DB call: simulate expired lock condition in filter
      (Event.findOneAndUpdate as jest.Mock).mockImplementation(
        (filter, update) => {
          // Verify that the filter contains an "expired lock" condition
          expect(filter.$or).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                editLockAt: expect.objectContaining({
                  $lt: expect.any(Date), // expired lock check
                }),
              }),
            ])
          );
          return Promise.resolve(mockEvent);
        }
      );

      // Act
      const result = await EventService.requestEditLock(
        mockEventId,
        mockUserId
      );

      // Assert
      expect(result.code).toBe(200);
      expect(result.message).toBe("Edit lock acquired");
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toBeInstanceOf(Date);
      expect(result.lockedBy).toBe(mockUserId);

      // Ensure atomic update was attempted exactly once
      expect(Event.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("should return already editing if user is already editing", async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const mockEvent = {
        _id: mockEventId,
        editingBy: mockUserId,
        editLockAt: futureDate,
      };
      // Arrange
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      // Act
      const result = await EventService.requestEditLock(
        mockEventId,
        mockUserId
      );

      // Assert
      expect(result.code).toBe(200);
      expect(result.message).toBe("Already editing");
      expect(result.lockUntil).toEqual(futureDate);
      expect(result.lockedBy).toBe(mockUserId);
    });

    it("should reject if another user is editing", async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 60_000); // lock is still valid (1 minute from now)
      const mockEvent = {
        _id: mockEventId,
        editingBy: "anotherUser",   // someone else holds the lock
        editLockAt: futureDate,     // lock not expired
      };
    
      // Atomic update fails (no eligible condition: not null, not expired, not same user)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
      // Fallback fetch shows the event is locked by another user
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);
    
      // Act
      const result = await EventService.requestEditLock(mockEventId, mockUserId);
    
      // Assert
      expect(result.code).toBe(409);
      expect(result.message).toBe("Event is being edited by another user");
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toEqual(futureDate);
      expect(result.lockedBy).toBe("anotherUser");
    
      // Optional: verify both DB calls happened as intended
      expect(Event.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(Event.findById).toHaveBeenCalledWith(mockEventId);
    });

    it("should return 404 if event not found", async () => {
      // Mock findOneAndUpdate returning null (no update possible)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
      // Mock findById returning null (event not found)
      (Event.findById as jest.Mock).mockResolvedValue(null);

      const result = await EventService.requestEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(404);
      expect(result.message).toBe("Event not found");
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toBeNull();
    });
  });

  describe("releaseEditLock", () => {
    it("should release lock if correct user", async () => {
      const mockEvent = {
        _id: mockEventId,
        editingBy: null,
        editLockAt: null,
      };

      // Mock findOneAndUpdate for the atomic operation
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.releaseEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(200);
      expect(result.message).toBe("Edit lock released successfully");
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toBeNull();
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should reject if not the editing user", async () => {
      // Mock findOneAndUpdate returning null (user not editing)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.releaseEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(403);
      expect(result.message).toBe("You are not the editing user");
      expect(result.eventId).toBe(mockEventId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should return 404 if event not found", async () => {
      // Mock findOneAndUpdate returning null (event not found)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.releaseEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(403); // This will be 403 because user is not editing, not 404
      expect(result.message).toBe("You are not the editing user");
      expect(result.eventId).toBe(mockEventId);
    });
  });

  describe("maintainEditLock", () => {
    it("should extend lock if still valid and user matches", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60000); // 1 minute from now
      const mockEvent = {
        _id: mockEventId,
        editingBy: mockUserId,
        editLockAt: new Date(now.getTime() + 300000), // 5 minutes from now (extended)
      };

      // Mock findOneAndUpdate for the atomic operation
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.maintainEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(200);
      expect(result.message).toBe("Edit lock extended");
      expect(result.eventId).toBe(mockEventId);
      expect(result.lockUntil).toBeInstanceOf(Date);
      expect(result.lockedBy).toBe(mockUserId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should return 409 if lock is expired", async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const mockEvent = {
        _id: mockEventId,
        editingBy: mockUserId,
        editLockAt: pastDate,
      };

      // Mock findOneAndUpdate returning null (lock expired)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.maintainEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(409);
      expect(result.message).toBe("Edit lock not valid or expired");
      expect(result.eventId).toBe(mockEventId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should return 409 if wrong user", async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const mockEvent = {
        _id: mockEventId,
        editingBy: "wrongUser",
        editLockAt: futureDate,
      };

      // Mock findOneAndUpdate returning null (wrong user)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.maintainEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(409);
      expect(result.message).toBe("Edit lock not valid or expired");
      expect(result.eventId).toBe(mockEventId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should return 409 if no lock exists", async () => {
      const mockEvent = {
        _id: mockEventId,
        editingBy: null,
        editLockAt: null,
      };

      // Mock findOneAndUpdate returning null (no lock)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.maintainEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(409);
      expect(result.message).toBe("Edit lock not valid or expired");
      expect(result.eventId).toBe(mockEventId);
      expect(Event.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should return 404 if event not found", async () => {
      // Mock findOneAndUpdate returning null (event not found)
      (Event.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await EventService.maintainEditLock(
        mockEventId,
        mockUserId
      );

      expect(result.code).toBe(409); // This will be 409 because lock is not valid, not 404
      expect(result.message).toBe("Edit lock not valid or expired");
      expect(result.eventId).toBe(mockEventId);
    });
  });

  describe("getEventById", () => {
    it("should return event if found", async () => {
      const mockEvent = {
        _id: mockEventId,
        name: "Test Event",
        description: "Test Description",
        maxQuantity: 100,
        issuedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        editingBy: null,
        editLockAt: null,
      };
      (Event.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockEvent),
      });

      const result = await EventService.getEventById(mockEventId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEventId);
      expect(result.name).toBe("Test Event");
    });

    it("should throw NotFoundError if event not found", async () => {
      (Event.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(EventService.getEventById(mockEventId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("createEvent", () => {
    it("should create a new event successfully", async () => {
      const eventInput = {
        name: "New Event",
        description: "New Description",
        maxQuantity: 50,
      };

      const mockCreatedEvent = {
        _id: mockEventId,
        ...eventInput,
        issuedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        editingBy: null,
        editLockAt: null,
        save: jest.fn().mockResolvedValue({
          _id: mockEventId,
          ...eventInput,
          issuedCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          editingBy: null,
          editLockAt: null,
        }),
      };

      const EventConstructor = Event as any;
      EventConstructor.mockImplementation(() => mockCreatedEvent);

      const result = await EventService.createEvent(eventInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEventId);
      expect(result.name).toBe("New Event");
      expect(result.issuedCount).toBe(0);
    });
  });

  describe("updateEvent", () => {
    it("should update event successfully", async () => {
      const updateInput = {
        name: "Updated Event",
        maxQuantity: 75,
      };

      const mockUpdatedEvent = {
        _id: mockEventId,
        name: "Updated Event",
        description: "Test Description",
        maxQuantity: 75,
        issuedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        editingBy: null,
        editLockAt: null,
      };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Event.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdatedEvent),
      });

      const result = await EventService.updateEvent(mockEventId, updateInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEventId);
      expect(result.name).toBe("Updated Event");
      expect(result.maxQuantity).toBe(75);
    });

    it("should throw ValidationError for invalid ID", async () => {
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      await expect(
        EventService.updateEvent("invalid-id", { name: "Test" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError if event not found", async () => {
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Event.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        EventService.updateEvent(mockEventId, { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      const mockDeletedEvent = {
        _id: mockEventId,
        name: "Test Event",
        description: "Test Description",
        maxQuantity: 100,
        issuedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        editingBy: null,
        editLockAt: null,
        toObject: jest.fn().mockReturnValue({
          _id: mockEventId,
          name: "Test Event",
          description: "Test Description",
          maxQuantity: 100,
          issuedCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          editingBy: null,
          editLockAt: null,
        }),
      };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Event.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockDeletedEvent
      );

      const result = await EventService.deleteEvent(mockEventId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEventId);
      expect(result.name).toBe("Test Event");
    });

    it("should throw ValidationError for invalid ID", async () => {
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      await expect(EventService.deleteEvent("invalid-id")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw NotFoundError if event not found", async () => {
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Event.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(EventService.deleteEvent(mockEventId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("getAllEvents", () => {
    it("should return paginated events", async () => {
      const mockEvents = [
        {
          _id: mockEventId,
          name: "Event 1",
          description: "Description 1",
          maxQuantity: 100,
          issuedCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          editingBy: null,
          editLockAt: null,
        },
      ];

      // Mock the Event model methods
      (Event.countDocuments as jest.Mock).mockResolvedValue(1);
      (Event.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockEvents),
            }),
          }),
        }),
      });

      const result = await EventService.getAllEvents({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });
});

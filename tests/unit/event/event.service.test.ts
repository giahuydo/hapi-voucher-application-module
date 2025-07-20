import * as EventService from '../../../src/modules/event/event.service';
import { Event } from '../../../src/modules/event/event.model';

jest.mock('../../../src/modules/event/event.model');

describe('EventService - Edit Lock', () => {
  const userId = 'user123';
  const eventId = 'event123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestEditLock', () => {
    it('should allow lock if event is not being edited', async () => {
      const mockEvent = {
        _id: eventId,
        editingBy: null,
        editLockAt: null,
        save: jest.fn().mockResolvedValue(true)
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.requestEditLock(eventId, userId);

      expect(result.code).toBe(200);
      expect(mockEvent.editingBy).toBe(userId);
      expect(mockEvent.save).toHaveBeenCalled();
    });

    it('should reject if another user is editing', async () => {
      const mockEvent = {
        _id: eventId,
        editingBy: 'anotherUser',
        editLockAt: new Date(Date.now() + 60000),
        save: jest.fn()
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.requestEditLock(eventId, userId);
      expect(result.code).toBe(409);
    });

    it('should return 404 if event not found', async () => {
      (Event.findById as jest.Mock).mockResolvedValue(null);
      const result = await EventService.requestEditLock(eventId, userId);
      expect(result.code).toBe(404);
    });
  });

  describe('releaseEditLock', () => {
    it('should release lock if correct user', async () => {
      const mockEvent = {
        _id: eventId,
        editingBy: userId,
        editLockAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.releaseEditLock(eventId, userId);
      expect(result.code).toBe(200);
      expect(mockEvent.editingBy).toBe(null);
    });

    it('should reject if not the editing user', async () => {
      const mockEvent = {
        _id: eventId,
        editingBy: 'anotherUser',
        editLockAt: new Date(),
        save: jest.fn()
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.releaseEditLock(eventId, userId);
      expect(result.code).toBe(403);
    });

    it('should return 404 if event not found', async () => {
      (Event.findById as jest.Mock).mockResolvedValue(null);
      const result = await EventService.releaseEditLock(eventId, userId);
      expect(result.code).toBe(404);
    });
  });

  describe('maintainEditLock', () => {
    it('should extend lock if still valid and user matches', async () => {
      const now = new Date();
      const mockEvent = {
        _id: eventId,
        editingBy: userId,
        editLockAt: new Date(now.getTime() + 60000),
        save: jest.fn().mockResolvedValue(true)
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.maintainEditLock(eventId, userId);
      expect(result.code).toBe(200);
      expect(mockEvent.save).toHaveBeenCalled();
    });

    it('should return 409 if lock is invalid or expired', async () => {
      const mockEvent = {
        _id: eventId,
        editingBy: 'wrongUser',
        editLockAt: new Date(Date.now() - 60000),
        save: jest.fn()
      };
      (Event.findById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.maintainEditLock(eventId, userId);
      expect(result.code).toBe(409);
    });

    it('should return 404 if event not found', async () => {
      (Event.findById as jest.Mock).mockResolvedValue(null);
      const result = await EventService.maintainEditLock(eventId, userId);
      expect(result.code).toBe(404);
    });
  });
});
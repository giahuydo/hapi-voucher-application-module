import * as eventService from '../../../src/services/event.service';
import * as eventController from '../../../src/api/event/controller';
import { Request, ResponseToolkit } from '@hapi/hapi';

jest.mock('../../../src/services/event.service');

const mockH = {
  response: jest.fn().mockReturnThis(),
  code: jest.fn().mockReturnThis()
} as any;

describe('Event Edit Lock Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow user to acquire edit lock', async () => {
    (eventService.requestEditLock as jest.Mock).mockResolvedValue({ code: 200, message: 'Edit lock acquired' });

    const req = {
      params: { eventId: 'event1' },
      auth: { credentials: { id: 'user1' } }
    } as unknown as Request;

    const result = await eventController.requestEditLock(req, mockH);
    expect(eventService.requestEditLock).toHaveBeenCalledWith('event1', 'user1');
    expect(mockH.response).toHaveBeenCalledWith({ message: 'Edit lock acquired' });
    expect(result.code).toBe(200);
  });

  it('should return 409 if event is being edited by another user', async () => {
    (eventService.requestEditLock as jest.Mock).mockResolvedValue({ code: 409, message: 'Event is being edited by another user' });

    const req = {
      params: { eventId: 'event1' },
      auth: { credentials: { id: 'user2' } }
    } as unknown as Request;

    const result = await eventController.requestEditLock(req, mockH);
    expect(result.code).toBe(409);
  });

  it('should release edit lock', async () => {
    (eventService.releaseEditLock as jest.Mock).mockResolvedValue({ code: 200, message: 'Edit lock released' });

    const req = {
      params: { eventId: 'event1' },
      auth: { credentials: { id: 'user1' } }
    } as unknown as Request;

    const result = await eventController.releaseEditLock(req, mockH);
    expect(eventService.releaseEditLock).toHaveBeenCalledWith('event1', 'user1');
    expect(result.code).toBe(200);
  });

  it('should maintain edit lock', async () => {
    (eventService.maintainEditLock as jest.Mock).mockResolvedValue({ code: 200, message: 'Edit lock extended' });

    const req = {
      params: { eventId: 'event1' },
      auth: { credentials: { id: 'user1' } }
    } as unknown as Request;

    const result = await eventController.maintainEditLock(req, mockH);
    expect(eventService.maintainEditLock).toHaveBeenCalledWith('event1', 'user1');
    expect(result.code).toBe(200);
  });
});
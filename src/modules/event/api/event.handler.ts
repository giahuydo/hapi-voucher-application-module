import { Request, ResponseToolkit } from '@hapi/hapi';
import * as EventService from './event.service';
import { CreateEventInput, UpdateEventInput } from './dto/event.input';

/**
 * Get all events
 */
export const getAllEvents = async (_req: Request, h: ResponseToolkit) => {
  try {
    const events = await EventService.getAllEvents();
    return h.response({ success: true, data: events });
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(500);
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const event = await EventService.getEventById(id);
    if (!event) {
      return h.response({ success: false, message: 'Event not found' }).code(404);
    }
    return h.response({ success: true, data: event });
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

/**
 * Create new event
 */
export const createEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const input = req.payload as CreateEventInput;
    const created = await EventService.createEvent(input);
    return h.response({ success: true, data: created }).code(201);
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

/**
 * Update event by ID
 */
export const updateEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const input = req.payload as UpdateEventInput;
    const updated = await EventService.updateEvent(id, input);

    if (!updated) {
      return h.response({ success: false, message: 'Event not found' }).code(404);
    }

    return h.response({ success: true, data: updated });
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const id = req.params.id;
    const deleted = await EventService.deleteEvent(id);
    if (!deleted) {
      return h.response({ success: false, message: 'Event not found' }).code(404);
    }

    return h.response({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

/**
 * Request edit lock
 */
export const requestEditLock = async (req: Request, h: ResponseToolkit) => {
  const { eventId } = req.params;
  const userId = req.auth.credentials?.userId as string;

  const { code, message } = await EventService.requestEditLock(eventId, userId);
  return h.response({ success: code === 200, message }).code(code);
};

/**
 * Release edit lock
 */
export const releaseEditLock = async (req: Request, h: ResponseToolkit) => {
  const { eventId } = req.params;
  const userId = req.auth.credentials?.userId as string;

  const { code, message } = await EventService.releaseEditLock(eventId, userId);
  return h.response({ success: code === 200, message }).code(code);
};

/**
 * Maintain (extend) edit lock
 */
export const maintainEditLock = async (req: Request, h: ResponseToolkit) => {
  const { eventId } = req.params;
  const userId = req.auth.credentials?.userId as string;

  const { code, message } = await EventService.maintainEditLock(eventId, userId);
  return h.response({ success: code === 200, message }).code(code);
};

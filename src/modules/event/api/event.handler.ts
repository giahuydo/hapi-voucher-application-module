import { Request, ResponseToolkit } from '@hapi/hapi';
import * as EventService from '../event.service';
import { CreateEventInput, UpdateEventInput } from '../dto/event.input';
import { toEventDTO, toEventDTOList } from '../event.transformer';
import { LockResponseDTO } from '../dto/event.dto';

/**
 * Get all events
 */
export const getAllEvents = async (_req: Request, h: ResponseToolkit) => {
  try {
    const events = await EventService.getAllEvents();
    return h.response({ success: true, data: toEventDTOList(events) });
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
    const event = await EventService.createEvent(input);
    return h.response({ success: true, data: toEventDTO(event) }).code(201);
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

    return h.response({ success: true, data: toEventDTO(updated) });
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
 * 📌 Request edit lock for a specific event
 * @route PUT /events/{eventId}/lock/request
 */
export const requestEditLock = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth.credentials?.userId as string;

    if (!userId) {
      return h.response({
        success: false,
        message: 'Unauthorized: Missing user ID'
      }).code(401);
    }

    const result: LockResponseDTO = await EventService.requestEditLock(eventId, userId);
    
    if (!result.eventId) {
      return h.response({
        success: false,
        message: 'Event ID is missing in the response'
      }).code(500);
    }

    return h.response({
      success: result.code === 200,
      eventId: result.eventId,
      message: result.message,
      lockUntil: result.lockUntil
    }).code(result.code);
  } catch (err: any) {
    return h.response({
      success: false,
      message: err.message || 'Unexpected error occurred'
    }).code(500);
  }
};


/**
 * Release edit lock
 */
export const releaseEditLock = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth.credentials?.userId as string;

    const result: LockResponseDTO = await EventService.releaseEditLock(eventId, userId);

    return h.response({
      success: result.code === 200,
      eventId: result.eventId,
      message: result.message,
      lockUntil: result.lockUntil
    }).code(result.code);
  } catch (err: any) {
    return h.response({
      success: false,
      message: err.message || 'Unexpected error'
    }).code(500);
  }
};

/**
 * Maintain (extend) edit lock
 */
export const maintainEditLock = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth.credentials?.userId as string;

    const result: LockResponseDTO = await EventService.maintainEditLock(eventId, userId);

    return h.response({
      success: result.code === 200,
      eventId: result.eventId,
      message: result.message,
      lockUntil: result.lockUntil
    }).code(result.code);
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(500);
  }
};
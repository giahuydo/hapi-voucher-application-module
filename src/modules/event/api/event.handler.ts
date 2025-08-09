import { Request, ResponseToolkit } from '@hapi/hapi';
import * as EventService from '../event.service';
import { CreateEventInput, UpdateEventInput } from '../dto/event.input';
import { transformEvent } from '../event.transformer';
import { LockResponseDTO } from '../dto/event.dto';
import { NotFoundError, handleError } from '../../../../utils/errorHandler';
import { logger } from '../../../../utils/logger';
import { formatSuccess, formatError } from '../../../../utils/responseFormatter';
import { parseSearchParameters } from '../../../../utils/PaginationQuery';


/**
 * Get all events
 */
export const getAllEvents = async (req: Request, h: ResponseToolkit) => {
  try {
    // Define searchable fields and their types for events
    const searchableFields = ['name', 'issuedCount', 'maxQuantity'];
    const fieldTypes = {
      name: { type: 'string' as const },
      issuedCount: { type: 'number' as const, operators: ['gte', 'lte', 'gt', 'lt'] },
      maxQuantity: { type: 'number' as const, operators: ['gte', 'lte', 'gt', 'lt'] }
    };
    
    // Parse dynamic search parameters with allowed fields and types
    const { paginationQuery, searchFields } = parseSearchParameters(req.query, searchableFields, fieldTypes);
    
    // Merge searchFields into paginationQuery
    const query = {
      ...paginationQuery,
      searchFields
    };

    logger.info(`[getAllEvents] Query: ${JSON.stringify(query)}`);
    
    const events = await EventService.getAllEvents(query);
    return formatSuccess(h, events, 'Fetched all events successfully');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const event = await EventService.getEventById(eventId);
    return formatSuccess(h, event, 'Event found');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * Create new event
 */
export const createEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const input = req.payload as CreateEventInput;
    const event = await EventService.createEvent(input);
    return h.response({ success: true, data: transformEvent(event) }).code(201);
  } catch (err: any) {
    return h.response({ success: false, message: err.message }).code(400);
  }
};

/**
 * Update event by ID
 */

export const updateEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const input = req.payload as UpdateEventInput;

    const updatedEvent = await EventService.updateEvent(eventId, input);
    return formatSuccess(h, updatedEvent, 'Event updated successfully');
  } catch (err) {
    return formatError(h, err);
  }
};
/**
 * Delete event by ID
 */
export const deleteEvent = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    await EventService.deleteEvent(eventId);
    return formatSuccess(h, null, 'Event deleted successfully');
  } catch (err) {
    return formatError(h, err);
  }
};

/**
 * 📌 API: Request edit lock for a specific event
 *
 * Description:
 *   1. If the current user is already the editor (`editingBy`), allow them to continue or refresh the `lockUntil`.
 *   2. If the event is not currently being edited, assign the lock to the current user.
 *   3. If the event is being edited by another user, return 409 Conflict.
 *
 * Endpoint: POST /events/{eventId}/editable/me
 * Auth: Requires JWT. Extracts `userId` from `request.auth.credentials`.
 *
 * Response:
 *   - 200 OK: The current user has been granted the edit lock.
 *   - 409 Conflict: Another user is currently editing the event.
 *   - 401 Unauthorized: Missing or invalid user credentials.
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
    const errorPayload = handleError(err);

    logger.error(`[EditLock] ${req.method.toUpperCase()} ${req.path} - ${errorPayload.message}`);

    return h.response({
      success: false,
      error: errorPayload.error,
      message: errorPayload.message,
    }).code(errorPayload.statusCode);
  }
};

/**
 * 📌 API: Release edit lock for a specific event
 *
 * Description:
 *   1. Requires JWT authentication, retrieves `userId` from the request.
 *   2. Calls the EventService to verify:
 *      - If the current user is the one holding the edit lock → clear the lock (`editingBy = null`, `lockUntil = null`).
 *      - If the user is not the lock holder → can either ignore or respond with a warning.
 *   3. Returns the response including the updated `lockUntil` value (usually null after release).
 *
 * Response:
 *   - 200 OK: Lock released successfully.
 *   - 403 Forbidden: User is not authorized to release the lock (optional behavior).
 *   - 500 Internal Server Error: Unexpected error occurred.
 */
export const releaseEditLock = async (req: Request, h: ResponseToolkit) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth.credentials?.userId as string;

    // 🔐 Call the service to release the lock if the current user is the lock owner
    const result: LockResponseDTO = await EventService.releaseEditLock(eventId, userId);

    // ✅ Send unified response format
    return h.response({
      success: result.code === 200,
      eventId: result.eventId,
      message: result.message,
      lockUntil: result.lockUntil
    }).code(result.code);
  } catch (err: any) {
    // ❌ Handle unexpected errors
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
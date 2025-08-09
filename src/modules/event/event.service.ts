import {Event} from  '../event/event.model';
import { CreateEventInput , UpdateEventInput } from './dto/event.input';
import { EventDTO, LockResponseDTO } from './dto/event.dto';
import { transformEvent } from './event.transformer';
import {logger} from "../../../utils/logger";
import { PaginationQuery, paginateModel } from "../../../utils/PaginationQuery";
import {NotFoundError, ValidationError, createError} from "../../../utils/errorHandler";
import mongoose from 'mongoose';


const EDIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * 📌 Request edit lock for a specific event
 * @param eventId - ID
 * @param userId - ID of the user requesting the lock
 * @returns HTTP code + message
 */
export const requestEditLock = async (
  eventId: string,
  userId: string
): Promise<LockResponseDTO> => {
  const now = new Date();
  const event = await Event.findById(eventId);

  if (!event) {
    return {
      code: 404,
      message: 'Event not found',
      eventId,
      lockUntil: null
    };
  }

  const lockExpired = !event.editLockAt || event.editLockAt < now;

  if (!event.editingBy || lockExpired) {
    event.editingBy = userId;
    event.editLockAt = new Date(now.getTime() + EDIT_TIMEOUT_MS);
    await event.save();

    return {
      code: 200,
      message: 'Edit lock acquired',
      eventId,
      lockUntil: event.editLockAt
    };
  }

  if (event.editingBy === userId) {
    return {
      code: 200,
      message: 'Already editing',
      eventId,
      lockUntil: event.editLockAt ?? null
    };
  }

  return {
    code: 409,
    message: 'Event is being edited by another user',
    eventId,
    lockUntil: event.editLockAt ?? null
  };
};
/**
 * Release edit lock for a specific event.
 */
export const releaseEditLock = async (
  eventId: string,
  userId: string
): Promise<LockResponseDTO> => {
  logger.info(`[ReleaseEditLock] User ${userId} is requesting to release lock on event ${eventId}`);

  const event = await Event.findById(eventId);

  if (!event) {
    logger.warn(`[ReleaseEditLock] Event not found: ${eventId}`);
    return {
      code: 404,
      message: 'Event not found',
      eventId,
      lockUntil: null
    };
  }

  logger.info(`[ReleaseEditLock] Current editingBy: ${event.editingBy}, Requesting user: ${userId}`);
  logger.info(`[ReleaseEditLock] editingBy: ${event.editingBy} (${typeof event.editingBy})`);
  logger.info(`[ReleaseEditLock] userId: ${userId} (${typeof userId})`);
  logger.info(`[ReleaseEditLock] Equal? ${event.editingBy === userId}`);

  if (event.editingBy?.toString() === userId.toString()) {
    event.editingBy = null;
    event.editLockAt = null;
    await event.save();
    logger.info(`[ReleaseEditLock] Lock released by user ${userId} on event ${eventId}`);
    return {
      code: 200,
      message: 'Edit lock released',
      eventId,
      lockUntil: null
    };
  }

  logger.warn(`[ReleaseEditLock] User ${userId} is not the editing user of event ${eventId}`);
  return {
    code: 403,
    message: 'You are not the editing user',
    eventId,
    lockUntil: event.editLockAt ?? null
  };
};

/**
 * Extend (maintain) edit lock if still valid.
 */
export const maintainEditLock = async (
  eventId: string,
  userId: string
): Promise<LockResponseDTO> => {
  const now = new Date();

  logger.info(`[MaintainEditLock] ⏳ Now: ${now.toISOString()}`);
  logger.info(`[MaintainEditLock] 🧑‍💻 userId: ${userId}`);
  logger.info(`[MaintainEditLock] 🔍 Checking eventId: ${eventId}`);

  const event = await Event.findById(eventId);

  if (!event) {
    logger.warn(`[MaintainEditLock] ❌ Event not found: ${eventId}`);
    return {
      code: 404,
      message: 'Event not found',
      eventId,
      lockUntil: null
    };
  }

  logger.info(`[MaintainEditLock] 📄 Current editingBy: ${event.editingBy}`);
  logger.info(`[MaintainEditLock] ⏱ Current lockUntil: ${event.editLockAt}`);

  const isValid =
    event.editingBy?.toString() === userId.toString() &&
    event.editLockAt &&
    event.editLockAt > now;

  logger.info(`[MaintainEditLock] ✅ isValid: ${isValid}`);

  if (isValid) {
    event.editLockAt = new Date(now.getTime() + EDIT_TIMEOUT_MS);
    await event.save();

    logger.info(`[MaintainEditLock] 🔁 Lock extended to: ${event.editLockAt?.toISOString()}`);

    return {
      code: 200,
      message: 'Edit lock extended',
      eventId,
      lockUntil: event.editLockAt
    };
  }

  logger.warn(`[MaintainEditLock] ⚠️ Edit lock not valid or expired for user: ${userId}`);

  return {
    code: 409,
    message: 'Edit lock not valid or expired',
    eventId,
    lockUntil: event.editLockAt ?? null
  };
};

export const getAllEvents = (query: PaginationQuery) =>
  paginateModel({
    model: Event,
    query,
    transform: transformEvent,
    searchableFields: ['name', 'issuedCount', 'maxQuantity'],
    fieldTypes: {
      name: { type: 'string' },
      issuedCount: { type: 'number', operators: ['gte', 'lte', 'gt', 'lt'] },
      maxQuantity: { type: 'number', operators: ['gte', 'lte', 'gt', 'lt'] }
    }
  });

/**
  * 📌 Get event by ID
  * @param eventId - Event ID
  * @returns The Event document transformed to DTO
  */
export const getEventById = async (eventId: string): Promise<EventDTO> => {
  const event = await Event.findById(eventId).lean();
  if (!event) throw new NotFoundError('Event not found');
  return transformEvent(event);
};


/**
 * 📌 Create a new event
 * @param input - Input data for event creation
 * @returns The newly created Event document
 */
export const createEvent = async (input: CreateEventInput) => {
  const created = new Event({
    ...input,
    issuedCount: 0 // default value if needed
  });

  const saved = await created.save();
  return transformEvent(saved);   
};

/**
 * Update an event by ID
 * @param id - Event ID
 * @param input - Partial update data
 * @returns Mongo document if updated, otherwise null
 */
export const updateEvent = async (
  id: string,
  input: UpdateEventInput
): Promise<EventDTO> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid event ID');
  }

  const updated = await Event.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError('Event not found');
  }

  return transformEvent(updated);
};

/**
 * Delete an event by ID
 * @param eventId - The ID of the event to delete
 * @returns The deleted event document if found, otherwise null
 */
export const deleteEvent = async (id: string): Promise<EventDTO> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid event ID');
  }

  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError('Event not found');
  }

  return transformEvent(deleted.toObject());
};

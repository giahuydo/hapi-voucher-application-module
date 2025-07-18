import {Event} from  '../event/event.model';
import { CreateEventInput , UpdateEventInput } from './dto/event.input';
import { EventDTO, LockResponseDTO } from './dto/event.dto';
import { toEventDTO } from './event.transformer';


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
  const event = await Event.findById(eventId);

  if (!event) {
    return {
      code: 404,
      message: 'Event not found',
      eventId,
      lockUntil: null
    };
  }

  if (event.editingBy === userId) {
    event.editingBy = null;
    event.editLockAt = null;
    await event.save();
    return {
      code: 200,
      message: 'Edit lock released',
      eventId,
      lockUntil: null
    };
  }

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
  const event = await Event.findById(eventId);

  if (!event) {
    return {
      code: 404,
      message: 'Event not found',
      eventId,
      lockUntil: null
    };
  }

  const isValid =
    event.editingBy === userId &&
    event.editLockAt &&
    event.editLockAt > now;

  if (isValid) {
    event.editLockAt = new Date(now.getTime() + EDIT_TIMEOUT_MS);
    await event.save();

    return {
      code: 200,
      message: 'Edit lock extended',
      eventId,
      lockUntil: event.editLockAt
    };
  }

  return {
    code: 409,
    message: 'Edit lock not valid or expired',
    eventId,
    lockUntil: event.editLockAt ?? null
  };
};


/**
 * 📥 Get all events
 */
export const getAllEvents = async () => {
  return await Event.find().lean();
};

/**
 * 📥 Get event by ID
 * @param id - The ID of the event to retrieve
 * @return The event object if found, otherwise null
 * */
export const getEventById = async (id: string) => {
  return await Event.findById(id).lean();
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
  return toEventDTO(saved);   
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
): Promise<EventDTO | null> => {
  const updated = await Event.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  return updated ? toEventDTO(updated) : null;
};

/**
 * Delete an event by ID
 * @param id - The ID of the event to delete
 * @returns The deleted event document if found, otherwise null
 */
export const deleteEvent = async (id: string) => {
  const deleted = await Event.findByIdAndDelete(id);
  return deleted ? toEventDTO(deleted) : null;
};


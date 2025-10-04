import {Event} from  '../event/event.model';
import { CreateEventInput , UpdateEventInput } from './dto/event.input';
import { EventDTO, LockResponseDTO } from './dto/event.dto';
import { transformEvent } from './event.transformer';
import {logger} from "../../../utils/logger";
import { PaginationQuery, paginateModel } from "../../../utils/PaginationQuery";
import {NotFoundError, ValidationError, createError} from "../../../utils/errorHandler";
import mongoose from 'mongoose';


const EDIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Helper function to check if event is locked
const isEventLocked = async (eventId: string, userId?: string): Promise<boolean> => {
  const event = await Event.findById(eventId);
  if (!event) return false;
  
  const now = new Date();
  return !!(event.editingBy && 
           event.editingBy !== userId && 
           event.editLockAt && 
           event.editLockAt > now);
};

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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const now = new Date();
    
    // Use atomic operation to prevent race conditions
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $or: [
          { editingBy: null },
          { editLockAt: { $lt: now } }
        ]
      },
      {
        $set: {
          editingBy: userId,
          editLockAt: new Date(now.getTime() + EDIT_TIMEOUT_MS)
        }
      },
      { 
        new: true, 
        session,
        upsert: false 
      }
    );

    if (!event) {
      // Check if event is locked by another user
      let lockedEvent;
      try {
        lockedEvent = await Event.findById(eventId).session(session);
      } catch (error) {
        // Fallback for test environment where session might not be supported
        lockedEvent = await Event.findById(eventId);
      }
      
      if (lockedEvent?.editingBy && lockedEvent?.editLockAt && lockedEvent.editLockAt > now) {
        // Check if the same user is already editing
        if (lockedEvent.editingBy === userId) {
          await session.abortTransaction();
          return {
            code: 200,
            message: 'Already editing',
            eventId,
            lockUntil: lockedEvent.editLockAt,
            lockedBy: lockedEvent.editingBy
          };
        }
        
        await session.abortTransaction();
        return {
          code: 409,
          message: 'Event is being edited by another user',
          eventId,
          lockUntil: lockedEvent.editLockAt,
          lockedBy: lockedEvent.editingBy
        };
      }
      
      await session.abortTransaction();
      return {
        code: 404,
        message: 'Event not found',
        eventId,
        lockUntil: null
      };
    }

    await session.commitTransaction();
    return {
      code: 200,
      message: 'Edit lock acquired',
      eventId,
      lockUntil: event.editLockAt,
      lockedBy: event.editingBy
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
/**
 * Release edit lock for a specific event.
 */
export const releaseEditLock = async (
  eventId: string,
  userId: string
): Promise<LockResponseDTO> => {
  logger.info(`[ReleaseEditLock] User ${userId} is requesting to release lock on event ${eventId}`);

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Use atomic operation to prevent race conditions
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        editingBy: userId
      },
      {
        $set: {
          editingBy: null,
          editLockAt: null
        }
      },
      { 
        new: true, 
        session 
      }
    );

    if (!event) {
      await session.abortTransaction();
      logger.warn(`[ReleaseEditLock] User ${userId} is not the editing user of event ${eventId}`);
      return {
        code: 403,
        message: 'You are not the editing user',
        eventId,
        lockUntil: null
      };
    }

    await session.commitTransaction();
    logger.info(`[ReleaseEditLock] Lock released by user ${userId} on event ${eventId}`);
    return {
      code: 200,
      message: 'Edit lock released successfully',
      eventId,
      lockUntil: null
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Extend (maintain) edit lock if still valid.
 */
export const maintainEditLock = async (
  eventId: string,
  userId: string
): Promise<LockResponseDTO> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const now = new Date();

    logger.info(`[MaintainEditLock] ⏳ Now: ${now.toISOString()}`);
    logger.info(`[MaintainEditLock] 🧑‍💻 userId: ${userId}`);
    logger.info(`[MaintainEditLock] 🔍 Checking eventId: ${eventId}`);

    // Use atomic operation to prevent race conditions
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        editingBy: userId,
        editLockAt: { $gt: now }
      },
      {
        $set: {
          editLockAt: new Date(now.getTime() + EDIT_TIMEOUT_MS)
        }
      },
      { 
        new: true, 
        session 
      }
    );

    if (!event) {
      await session.abortTransaction();
      logger.warn(`[MaintainEditLock] ⚠️ Edit lock not valid or expired for user: ${userId}`);
      return {
        code: 409,
        message: 'Edit lock not valid or expired',
        eventId,
        lockUntil: null
      };
    }

    await session.commitTransaction();
    logger.info(`[MaintainEditLock] 🔁 Lock extended to: ${event.editLockAt?.toISOString()}`);

    return {
      code: 200,
      message: 'Edit lock extended',
      eventId,
      lockUntil: event.editLockAt,
      lockedBy: event.editingBy
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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
 * @param userId - Optional user ID to check lock permissions
 * @returns Mongo document if updated, otherwise null
 */
export const updateEvent = async (
  id: string,
  input: UpdateEventInput,
  userId?: string
): Promise<EventDTO> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid event ID');
  }

  // Check if event is locked by another user before updating
  if (userId) {
    const isLocked = await isEventLocked(id, userId);
    if (isLocked) {
      throw createError('ConflictError', 'Event is currently being edited by another user', 409);
    }
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

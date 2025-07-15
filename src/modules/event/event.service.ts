import {Event} from  '../event/event.model';

const EDIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Request edit lock for a specific event.
 */
export const requestEditLock = async (
  eventId: string,
  userId: string
): Promise<{ code: number; message: string }> => {
  const now = new Date();
  const event = await Event.findById(eventId);

  if (!event) {
    return { code: 404, message: 'Event not found' };
  }

  const lockExpired = !event.editLockAt || event.editLockAt < now;

  if (!event.editingBy || lockExpired) {
    event.editingBy = userId;
    event.editLockAt = new Date(now.getTime() + EDIT_TIMEOUT_MS);
    await event.save();
    return { code: 200, message: 'Edit lock acquired' };
  }

  if (event.editingBy === userId) {
    return { code: 200, message: 'Already editing' };
  }

  return { code: 409, message: 'Event is being edited by another user' };
};

/**
 * Release edit lock for a specific event.
 */
export const releaseEditLock = async (
  eventId: string,
  userId: string
): Promise<{ code: number; message: string }> => {
  const event = await Event.findById(eventId);
  if (!event) {
    return { code: 404, message: 'Event not found' };
  }

  if (event.editingBy === userId) {
    event.editingBy = null;
    event.editLockAt = null;
    await event.save();
    return { code: 200, message: 'Edit lock released' };
  }

  return { code: 403, message: 'You are not the editing user' };
};

/**
 * Extend (maintain) edit lock if still valid.
 */
export const maintainEditLock = async (
  eventId: string,
  userId: string
): Promise<{ code: number; message: string }> => {
  const now = new Date();
  const event = await Event.findById(eventId);
  if (!event) {
    return { code: 404, message: 'Event not found' };
  }

  if (event.editingBy === userId && event.editLockAt && event.editLockAt > now) {
    event.editLockAt = new Date(now.getTime() + EDIT_TIMEOUT_MS);
    await event.save();
    return { code: 200, message: 'Edit lock extended' };
  }

  return { code: 409, message: 'Edit lock not valid or expired' };
};

import { EventDTO } from './dto/event.dto';
import { EventDocument } from './event.model';

/**
 * Transforms a Mongoose EventDocument into a safe EventDTO
 */
export function transformEvent(event: EventDocument): EventDTO {
  return {
    id: event._id.toString(),
    name: event.name,
    maxQuantity: event.maxQuantity,
    issuedCount: event.issuedCount,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    editingBy: event.editingBy ?? null,
    editLockAt: event.editLockAt ?? null,
  };
}

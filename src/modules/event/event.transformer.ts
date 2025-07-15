
import { EventDTO } from '../event/dto/event.dto';
import { EventDocument } from '../event/event.model';

export const toEventDTO = (doc: EventDocument): EventDTO => {
  return {
    id: doc._id.toString(),
    name: doc.name,
    maxQuantity: doc.maxQuantity,
    issuedCount: doc.issuedCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    editingBy: doc.editingBy ?? null,
    editLockAt: doc.editLockAt ?? null
  };
};

export const toEventDTOList = (docs: EventDocument[]): EventDTO[] => {
  return docs.map(toEventDTO);
};

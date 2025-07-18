
import { EventDTO } from '../event/dto/event.dto';
import { EventDocument } from '../event/event.model';
import { Types } from 'mongoose';

type ObjectIdLike = string | Types.ObjectId;

type EventInput = Partial<{
  _id: ObjectIdLike;
  name: string;
  maxQuantity: number;
  issuedCount: number;
  createdAt: Date;
  updatedAt: Date;
  editingBy?: ObjectIdLike | null;
  editLockAt?: Date | null;
}>;

export const toEventDTO = (doc: EventDocument | EventInput): EventDTO => {
  return {
    id: doc._id?.toString?.() ?? '',
    name: doc.name ?? '',
    maxQuantity: doc.maxQuantity ?? 0,
    issuedCount: doc.issuedCount ?? 0,
    createdAt: doc.createdAt ?? new Date(0),
    updatedAt: doc.updatedAt ?? new Date(0),
    editingBy: doc.editingBy?.toString?.() ?? null,
    editLockAt: doc.editLockAt ?? null,
  };
};
export const toEventDTOList = (
  docs: (EventDocument | EventInput)[]
): EventDTO[] => {
  return docs.map(toEventDTO);
};
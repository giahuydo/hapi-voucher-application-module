/**
 * Data Transfer Object for Event
 */
export interface EventDTO {
  id: string;
  name: string;
  maxQuantity: number;
  issuedCount: number;
  createdAt: Date;
  updatedAt: Date;
  editingBy: string | null;
  editLockAt: Date | null;
}

export interface LockResponseDTO {
  code: number;
  message: string;
  eventId: string;
  lockUntil: Date | null;
}


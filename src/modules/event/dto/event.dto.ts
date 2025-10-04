/**
 * Data Transfer Object for Event
 */
export interface EventDTO {
  id: string;
  name: string;
  description?: string;
  maxQuantity: number;
  issuedCount: number;
  isActive: boolean;
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
  lockedBy?: string | null; // User who holds/requested the lock
}


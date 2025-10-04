/**
 * Data Transfer Object (DTO) for returning a voucher to client.
 */
export interface VoucherDTO {
  id: string;
  eventId: string;
  issuedTo: string;
  code: string;
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
  // Voucher specific fields
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  usedCount?: number;
  usageLimit?: number;
  isActive?: boolean;
  // Date fields (consolidated)
  validFrom?: string;    // When voucher becomes valid
  validTo?: string;      // When voucher expires
  // Additional fields for CreateVoucherRequest
  recipientName?: string;
  phoneNumber?: string;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  notes?: string;
  // Event information from populate
  event: {
    id: string;
    name: string;
    description: string;
    maxQuantity: number;
    issuedCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

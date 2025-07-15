/**
 * Data Transfer Object (DTO) for returning a voucher to client.
 */
export interface VoucherDTO {
  id: string;
  eventId: string;
  issuedTo: string;
  code: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

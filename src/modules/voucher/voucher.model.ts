import mongoose, { Document, Schema } from "mongoose";

export interface VoucherDocument extends Document {
  eventId: mongoose.Types.ObjectId;
  code: string;
  issuedTo: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Voucher specific fields
  name?: string;
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  usedCount?: number;
  usageLimit?: number;
  isActive?: boolean;
  // Date fields (consolidated)
  validFrom?: Date;    // When voucher becomes valid
  validTo?: Date;      // When voucher expires (replaces expiryDate)
  // Additional fields for CreateVoucherRequest
  recipientName?: string;
  phoneNumber?: string;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  notes?: string;
}

const voucherSchema = new Schema<VoucherDocument>({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  issuedTo: {
    type: String,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  // Voucher specific fields
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed',
  },
  value: {
    type: Number,
    required: false,
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  usageLimit: {
    type: Number,
    required: false,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Date fields (consolidated)
  validFrom: {
    type: Date,
    required: false,
  },
  validTo: {
    type: Date,
    required: false,
  },
  // Additional fields for CreateVoucherRequest
  recipientName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  minimumOrderAmount: {
    type: Number,
    required: false,
    min: 0,
  },
  maximumDiscount: {
    type: Number,
    required: false,
    min: 0,
  },
  notes: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Voucher = mongoose.model<VoucherDocument>("Voucher", voucherSchema);

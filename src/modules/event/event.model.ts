import mongoose, { Document, Schema } from "mongoose";

export interface EventDocument extends Document {
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

const eventSchema = new Schema<EventDocument>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
  issuedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  editingBy: {
    type: String,
    default: null
  },
  editLockAt: {
    type: Date,
    default: null
  }
});

export const Event = mongoose.model<EventDocument>("Event", eventSchema);

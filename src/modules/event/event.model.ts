import mongoose, { Document, Schema } from "mongoose";

export interface EventDocument extends Document {
  updatedAt: Date;
  name: string;
  maxQuantity: number;
  issuedCount: number;
  createdAt: Date;
  editingBy: string | null;
  editLockAt: Date | null;
}

const eventSchema = new Schema<EventDocument>({
  name: {
    type: String,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
  issuedCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
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

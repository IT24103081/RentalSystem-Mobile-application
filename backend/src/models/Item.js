import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    pricePerDay: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

itemSchema.index({ name: 1, isDeleted: 1 });

export default mongoose.model("Item", itemSchema);

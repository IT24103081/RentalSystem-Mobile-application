import mongoose from "mongoose";

const damagedItemLogSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    pricePerDay: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: "Marked as damaged" },
    deletedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("DamagedItemLog", damagedItemLogSchema);

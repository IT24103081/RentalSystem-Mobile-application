import mongoose from "mongoose";

const rentalRecordSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    customerName: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    givingDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    sourceType: { type: String, enum: ["warehouse", "shop"], required: true },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    status: {
      type: String,
      enum: ["finalized", "returned", "cancelled"],
      default: "finalized"
    },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("RentalRecord", rentalRecordSchema);

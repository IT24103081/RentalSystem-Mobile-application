import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerDay: { type: Number, required: true, min: 0 },
    givingDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
      index: true
    },
    itemSnapshot: {
      name: { type: String, default: null },
      pricePerDay: { type: Number, default: 0, min: 0 }
    },
    quantity: { type: Number, default: 1, min: 1 },
    lineItems: [lineItemSchema],
    orderSource: {
      type: String,
      required: true,
      enum: ["warehouse", "shop"],
      index: true
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    orderDate: { type: Date, default: Date.now, required: true },
    givingDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    paymentType: { type: String, required: true, enum: ["full", "advance"] },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    totalDue: { type: Number, required: true, min: 0, default: 0 },
    balance: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    invoiceNumber: { type: String, default: null },
    invoiceGeneratedAt: { type: Date, default: null },
    overdueDays: { type: Number, required: true, min: 0, default: 0 },
    lastOverdueChargeDate: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ returnDate: 1, status: 1, lastOverdueChargeDate: 1 });

export default mongoose.model("Order", orderSchema);

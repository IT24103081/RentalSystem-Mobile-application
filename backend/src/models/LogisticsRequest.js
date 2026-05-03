import mongoose from "mongoose";

const logisticsRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["order_dispatch", "shop_transfer"],
      index: true
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    itemName: { type: String, trim: true, default: "" },
    requestedQuantity: { type: Number, min: 1, default: 1 },
    requestedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    requestedByUsername: { type: String, trim: true, default: "" },
    requestedByRole: {
      type: String,
      enum: ["admin", "warehouse", "shop", "logistics", "analytics", "rental"],
      default: "logistics"
    },
    sourceWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null
    },
    sourceShopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    targetWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null
    },
    targetShopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    notes: { type: String, trim: true, default: "" },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "ready", "received", "issued", "rejected"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("LogisticsRequest", logisticsRequestSchema);

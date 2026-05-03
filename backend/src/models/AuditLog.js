import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    logisticsRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LogisticsRequest",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ["order_dispatch", "shop_transfer"]
    },
    itemInfo: {
      itemId: mongoose.Schema.Types.ObjectId,
      itemName: String,
      quantity: Number,
      pricePerDay: Number,
      availableStock: Number
    },
    customerInfo: {
      name: String,
      address: String,
      phone: String
    },
    orderDetails: {
      orderId: mongoose.Schema.Types.ObjectId,
      orderDate: Date,
      givingDate: Date,
      returnDate: Date,
      paymentType: String,
      paidAmount: Number,
      totalDue: Number,
      balance: Number,
      status: String
    },
    transferDetails: {
      sourceWarehouseId: mongoose.Schema.Types.ObjectId,
      sourceWarehouseName: String,
      sourceShopId: mongoose.Schema.Types.ObjectId,
      sourceShopName: String,
      targetWarehouseId: mongoose.Schema.Types.ObjectId,
      targetWarehouseName: String,
      targetShopId: mongoose.Schema.Types.ObjectId,
      targetShopName: String
    },
    notes: { type: String, trim: true, default: "" },
    requestStatus: {
      type: String,
      default: "pending"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff"
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);

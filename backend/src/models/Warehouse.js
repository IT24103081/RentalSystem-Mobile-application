import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    logisticsManagerName: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Warehouse", warehouseSchema);

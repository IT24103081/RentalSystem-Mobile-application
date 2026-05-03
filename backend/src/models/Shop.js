import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

shopSchema.index({ warehouseId: 1, code: 1 });

export default mongoose.model("Shop", shopSchema);

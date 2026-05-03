import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: false, trim: true },
    // Kept temporarily for legacy migration of previously created plain-text staff records.
    password: { type: String, required: false, trim: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["admin", "warehouse", "shop", "logistics", "analytics", "rental"]
    },
    assignmentType: {
      type: String,
      enum: ["warehouse", "shop", "none"],
      default: "none"
    },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Staff", staffSchema);

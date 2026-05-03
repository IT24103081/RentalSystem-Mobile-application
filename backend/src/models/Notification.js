import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    message:   { type: String, required: true, trim: true },
    type:      { type: String, enum: ["sms", "alert"], default: "sms" },
    phone:     { type: String, default: null, trim: true },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
    sentAt:    { type: Date, default: null },
    smsStatus: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    smsError:  { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);

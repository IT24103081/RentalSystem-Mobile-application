import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import logisticsRoutes from "./routes/logisticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import rentalRecordRoutes from "./routes/rentalRecordRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { startOverdueBillingScheduler } from "./utils/overdueScheduler.js";
import { ensureDefaultAdmin } from "./utils/seedAdmin.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files for item images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api", authRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", ordersRoutes);
app.use("/api", logisticsRoutes);
app.use("/api", adminRoutes);
app.use("/api", notificationRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", rentalRecordRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "RentalDB"
    });
    console.log("MongoDB connected");
    await ensureDefaultAdmin();
    startOverdueBillingScheduler();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

startServer();

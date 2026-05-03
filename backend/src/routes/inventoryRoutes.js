import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Item from "../models/Item.js";
import DamagedItemLog from "../models/DamagedItemLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const uploadDir = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "item-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  }
});

// Public endpoint for items (no auth required)
router.get("/items/public/list", async (req, res) => {
  try {
    const items = await Item.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.use(requireAuth);

router.post("/items", upload.single("image"), requireRole("warehouse", "admin"), async (req, res) => {
  try {
    const { name, quantity, pricePerDay } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const item = await Item.create({ name, quantity, pricePerDay, imageUrl });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/items", requireRole("warehouse", "shop", "logistics", "admin", "rental"), async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { isDeleted: false };
    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/items/:id", requireRole("warehouse", "admin"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const { name, quantity, pricePerDay } = req.body;
    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (pricePerDay !== undefined) item.pricePerDay = pricePerDay;

    await item.save();
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/items/:id", requireRole("warehouse", "admin"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const damagedQuantity = Number(req.body?.damagedQuantity);
    const reason = (req.body?.reason || "").trim();

    if (!Number.isFinite(damagedQuantity) || damagedQuantity <= 0) {
      return res.status(400).json({ message: "Damaged quantity must be greater than 0" });
    }

    if (damagedQuantity > item.quantity) {
      return res
        .status(400)
        .json({ message: "Damaged quantity cannot be greater than available quantity" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required for damaged item log" });
    }

    const remainingQuantity = item.quantity - damagedQuantity;
    item.quantity = remainingQuantity;

    if (remainingQuantity === 0) {
      item.isDeleted = true;
      item.deletedAt = new Date();
    }

    await item.save();

    await DamagedItemLog.create({
      itemId: item._id,
      name: item.name,
      quantity: damagedQuantity,
      pricePerDay: item.pricePerDay,
      reason,
      deletedAt: new Date()
    });

    return res.json({
      message:
        remainingQuantity === 0
          ? "Item fully marked as damaged and moved to damaged history"
          : "Damaged quantity logged and available stock updated",
      remainingQuantity
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/items/damaged/history", requireRole("warehouse", "admin"), async (_req, res) => {
  try {
    const damagedItems = await DamagedItemLog.find({}).sort({ deletedAt: -1 });
    res.json(damagedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

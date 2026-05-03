import express from "express";
import RentalRecord from "../models/RentalRecord.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const normalizePayload = (payload = {}) => ({
  ...payload,
  customerName: typeof payload.customerName === "string" ? payload.customerName.trim() : payload.customerName,
  itemName: typeof payload.itemName === "string" ? payload.itemName.trim() : payload.itemName,
  notes: typeof payload.notes === "string" ? payload.notes.trim() : payload.notes
});

const validateRentalRecordPayload = (payload) => {
  if (!payload.customerName) {
    return "Customer name is required";
  }

  if (!payload.itemName) {
    return "Item is required";
  }

  const quantity = Number(payload.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be a whole number greater than 0";
  }

  const totalAmount = Number(payload.totalAmount);
  if (Number.isNaN(totalAmount) || totalAmount < 0) {
    return "Total amount must be 0 or higher";
  }

  const givingDate = new Date(payload.givingDate);
  const returnDate = new Date(payload.returnDate);
  if (Number.isNaN(givingDate.valueOf()) || Number.isNaN(returnDate.valueOf())) {
    return "Giving date and return date are required";
  }

  givingDate.setHours(0, 0, 0, 0);
  returnDate.setHours(0, 0, 0, 0);
  const today = startOfToday();

  if (givingDate < today) {
    return "Giving date cannot be in the past";
  }

  if (returnDate < today) {
    return "Return date cannot be in the past";
  }

  if (returnDate < givingDate) {
    return "Return date cannot be before giving date";
  }

  return null;
};

router.post("/rental-records", requireAuth, requireRole("rental"), async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateRentalRecordPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const record = await RentalRecord.create(payload);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/rental-records", requireAuth, requireRole("rental"), async (_req, res) => {
  try {
    const records = await RentalRecord.find({}).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/rental-records/:id", requireAuth, requireRole("rental"), async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validateRentalRecordPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const record = await RentalRecord.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!record) {
      return res.status(404).json({ message: "Rental record not found" });
    }

    return res.json(record);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/rental-records/:id", requireAuth, requireRole("rental"), async (req, res) => {
  try {
    const deleted = await RentalRecord.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Rental record not found" });
    }

    return res.json({ message: "Rental record deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

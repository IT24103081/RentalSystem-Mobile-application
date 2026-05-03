import express from "express";
import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";
import Warehouse from "../models/Warehouse.js";
import Shop from "../models/Shop.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  validateUsername,
  validatePassword,
  validateWarehouseName,
  validateCode
} from "../utils/validators.js";

const router = express.Router();

const ROLE_USER_ID_PREFIX = {
  admin: "AD",
  warehouse: "WH",
  shop: "SH",
  logistics: "LG",
  analytics: "AN",
  rental: "RT"
};

const generateUserId = async (role) => {
  const prefix = ROLE_USER_ID_PREFIX[role] || "ST";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const timeSuffix = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 900 + 100).toString();
    const candidate = `${prefix}${timeSuffix}${randomSuffix}`;

    const exists = await Staff.exists({ userId: candidate });
    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Could not generate unique user ID");
};

const normalizeStaffAssignment = async (role, assignmentType, assignmentId) => {
  if (!assignmentType || !["warehouse", "shop", "none"].includes(assignmentType)) {
    return { error: "Assignment type is required" };
  }

  if (role === "warehouse" && assignmentType !== "warehouse") {
    return { error: "Warehouse staff must use warehouse assignment type" };
  }

  if (role === "shop" && assignmentType !== "shop") {
    return { error: "Shop staff must use shop assignment type" };
  }

  if (role === "warehouse") {
    if (!assignmentId) {
      return { error: "Warehouse staff must have a warehouse assignment" };
    }

    const warehouseExists = await Warehouse.exists({ _id: assignmentId });
    if (!warehouseExists) {
      return { error: "Selected warehouse assignment is invalid" };
    }

    return { assignmentType: "warehouse", assignmentId };
  }

  if (role === "shop") {
    if (!assignmentId) {
      return { error: "Shop staff must have a shop assignment" };
    }

    const shopExists = await Shop.exists({ _id: assignmentId });
    if (!shopExists) {
      return { error: "Selected shop assignment is invalid" };
    }

    return { assignmentType: "shop", assignmentId };
  }

  if (assignmentType === "warehouse") {
    if (!assignmentId) {
      return { error: "Assignment ID is required for warehouse assignment type" };
    }

    const warehouseExists = await Warehouse.exists({ _id: assignmentId });
    if (!warehouseExists) {
      return { error: "Selected warehouse assignment is invalid" };
    }

    return { assignmentType: "warehouse", assignmentId };
  }

  if (assignmentType === "shop") {
    if (!assignmentId) {
      return { error: "Assignment ID is required for shop assignment type" };
    }

    const shopExists = await Shop.exists({ _id: assignmentId });
    if (!shopExists) {
      return { error: "Selected shop assignment is invalid" };
    }

    return { assignmentType: "shop", assignmentId };
  }

  return { assignmentType: "none", assignmentId: null };
};

router.use(requireAuth);

router.post("/admin/warehouses", requireRole("admin"), async (req, res) => {
  try {
    const { name, code, logisticsManagerName } = req.body;
    
    // Validate inputs
    const nameError = validateWarehouseName(name);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }
    
    const codeError = validateCode(code);
    if (codeError) {
      return res.status(400).json({ message: codeError });
    }

    const warehouse = await Warehouse.create({ name, code, logisticsManagerName });

    const shopsPayload = [1, 2, 3, 4].map((index) => ({
      name: `${name} Shop ${index}`,
      code: `${code}-S${index}`,
      warehouseId: warehouse._id
    }));

    const shops = await Shop.insertMany(shopsPayload);
    res.status(201).json({ warehouse, shops });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/admin/warehouses", requireRole("admin", "warehouse", "shop", "logistics"), async (_req, res) => {
  try {
    const warehouses = await Warehouse.find({}).sort({ createdAt: -1 });
    const warehouseIds = warehouses.map((warehouse) => warehouse._id);
    const shops = await Shop.find({ warehouseId: { $in: warehouseIds } }).sort({ name: 1 });

    const response = warehouses.map((warehouse) => ({
      ...warehouse.toObject(),
      shops: shops.filter(
        (shop) => shop.warehouseId.toString() === warehouse._id.toString()
      )
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/admin/shops", requireRole("admin", "warehouse", "shop", "logistics"), async (_req, res) => {
  try {
    const shops = await Shop.find({}).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/admin/warehouses/:id", requireRole("admin"), async (req, res) => {
  try {
    // Delete all shops associated with this warehouse
    await Shop.deleteMany({ warehouseId: req.params.id });
    
    // Delete the warehouse
    const result = await Warehouse.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    return res.json({ message: "Warehouse and associated shops deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/admin/staff", requireRole("admin"), async (req, res) => {
  try {
    const { username, password, role, assignmentType, assignmentId } = req.body;

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const normalizedAssignment = await normalizeStaffAssignment(
      role,
      assignmentType,
      assignmentId || null
    );
    if (normalizedAssignment.error) {
      return res.status(400).json({ message: normalizedAssignment.error });
    }

    const generatedUserId = await generateUserId(role);

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      userId: generatedUserId,
      username,
      passwordHash,
      role,
      assignmentType: normalizedAssignment.assignmentType,
      assignmentId: normalizedAssignment.assignmentId
    });

    res.status(201).json({
      _id: staff._id,
      userId: staff.userId,
      username: staff.username,
      role: staff.role,
      assignmentType: staff.assignmentType,
      assignmentId: staff.assignmentId,
      createdAt: staff.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/admin/staff", requireRole("admin"), async (_req, res) => {
  try {
    const staff = await Staff.find({})
      .select("_id userId username role assignmentType assignmentId createdAt updatedAt")
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/admin/staff/:id", requireRole("admin"), async (req, res) => {
  try {
    const existingStaff = await Staff.findById(req.params.id).select(
      "_id userId username role assignmentType assignmentId createdAt updatedAt"
    );

    if (!existingStaff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const updatePayload = { ...req.body };
    if (updatePayload.password) {
      updatePayload.passwordHash = await bcrypt.hash(updatePayload.password, 10);
      delete updatePayload.password;
    }

    if (updatePayload.username !== undefined) {
      const usernameError = validateUsername(updatePayload.username);
      if (usernameError) {
        return res.status(400).json({ message: usernameError });
      }
    }

    const nextRole = updatePayload.role || existingStaff.role;
    const nextAssignmentType = updatePayload.assignmentType || existingStaff.assignmentType;
    const nextAssignmentId =
      updatePayload.assignmentId !== undefined ? updatePayload.assignmentId : existingStaff.assignmentId;

    const normalizedAssignment = await normalizeStaffAssignment(
      nextRole,
      nextAssignmentType,
      nextAssignmentId || null
    );
    if (normalizedAssignment.error) {
      return res.status(400).json({ message: normalizedAssignment.error });
    }

    updatePayload.assignmentType = normalizedAssignment.assignmentType;
    updatePayload.assignmentId = normalizedAssignment.assignmentId;

    const staff = await Staff.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
      select: "_id userId username role assignmentType assignmentId createdAt updatedAt"
    });

    return res.json(staff);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/admin/staff/:id", requireRole("admin"), async (req, res) => {
  try {
    const result = await Staff.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    return res.json({ message: "Staff member deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

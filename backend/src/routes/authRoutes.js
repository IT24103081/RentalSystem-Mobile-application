import express from "express";
import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";
import { requireAuth } from "../middleware/auth.js";
import { signAuthToken } from "../utils/authToken.js";
import {
  validateUsername,
  validatePassword
} from "../utils/validators.js";

const router = express.Router();

router.post("/auth/bootstrap-admin", async (req, res) => {
  try {
    const existingCount = await Staff.countDocuments({});
    if (existingCount > 0) {
      return res.status(400).json({ message: "Bootstrap disabled after first staff account" });
    }

    const { username, password } = req.body;
    
    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Staff.create({
      username,
      passwordHash,
      role: "admin",
      assignmentType: "none",
      assignmentId: null
    });

    const token = signAuthToken(admin);
    return res.status(201).json({
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        assignmentType: admin.assignmentType,
        assignmentId: admin.assignmentId
      }
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const staff = await Staff.findOne({ username }).select("+password");

    if (!staff) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const legacyPlaintextPassword = staff.password;
    const isLegacyMatch = legacyPlaintextPassword && legacyPlaintextPassword === password;
    const isHashMatch = staff.passwordHash
      ? await bcrypt.compare(password, staff.passwordHash)
      : false;

    if (!isLegacyMatch && !isHashMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (isLegacyMatch && !staff.passwordHash) {
      staff.passwordHash = await bcrypt.hash(password, 10);
      staff.password = undefined;
      await staff.save();
    }

    const token = signAuthToken(staff);

    return res.json({
      token,
      user: {
        id: staff._id,
        username: staff.username,
        role: staff.role,
        assignmentType: staff.assignmentType,
        assignmentId: staff.assignmentId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;

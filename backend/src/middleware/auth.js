import Staff from "../models/Staff.js";
import { verifyAuthToken } from "../utils/authToken.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const payload = verifyAuthToken(token);
    const staff = await Staff.findById(payload.sub).select(
      "_id username role assignmentType assignmentId"
    );

    if (!staff) {
      return res.status(401).json({ message: "User not found for token" });
    }

    req.user = {
      id: staff._id.toString(),
      username: staff.username,
      role: staff.role,
      assignmentType: staff.assignmentType,
      assignmentId: staff.assignmentId ? staff.assignmentId.toString() : null
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden for this role" });
  }

  return next();
};

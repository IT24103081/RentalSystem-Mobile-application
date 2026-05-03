import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";

export const ensureDefaultAdmin = async () => {
  const existingAdmin = await Staff.findOne({ username: "admin" }).select("+password");

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash("Admin123", 10);

  await Staff.create({
    userId: "AD000001",
    username: "admin",
    passwordHash,
    role: "admin",
    assignmentType: "none",
    assignmentId: null
  });

  console.log("Default admin account created: username=admin, password=Admin123");
};

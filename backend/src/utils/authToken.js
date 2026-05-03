import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = "12h";

export const signAuthToken = (staff) => {
  const secret = process.env.JWT_SECRET || "change-this-in-production";
  return jwt.sign(
    {
      sub: staff._id.toString(),
      role: staff.role,
      assignmentType: staff.assignmentType,
      assignmentId: staff.assignmentId ? staff.assignmentId.toString() : null
    },
    secret,
    { expiresIn: TOKEN_EXPIRY }
  );
};

export const verifyAuthToken = (token) => {
  const secret = process.env.JWT_SECRET || "change-this-in-production";
  return jwt.verify(token, secret);
};

const jwt = require("jsonwebtoken");
const ResponseHelper = require("../utils/responseHelper");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return ResponseHelper.error(res, "Authentication required", null, 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload should contain userId, username, and role (when issued)
    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role || null
    };
    next();
  } catch {
    return ResponseHelper.error(res, "Invalid or expired token", null, 401);
  }
};
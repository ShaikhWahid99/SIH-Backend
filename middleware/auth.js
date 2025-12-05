const User = require("../models/User");
const jwt = require("jsonwebtoken");

async function requireAuth(req, res, next) {
  try {
    // Get JWT from Authorization header
    const raw = req.get("Authorization") || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token signature + expiration
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from token payload
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Attach user ID to request for API handlers
    req.userId = user._id.toString();

    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}

module.exports = { requireAuth };

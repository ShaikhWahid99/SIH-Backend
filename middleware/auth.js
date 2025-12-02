const User = require("../models/User");
const jwt = require("jsonwebtoken");

async function requireAuth(req, res, next) {
  try {
    const raw = req.get("Authorization") || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);

    if (!user || user.accessToken !== token) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    req.userId = user._id.toString();
    next();
  } catch (err) {
    console.error("requireAuth:", err);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}

module.exports = { requireAuth };

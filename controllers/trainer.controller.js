const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Trainer = require("../models/trainer");

// JWT helpers
function signAccessToken(trainer) {
  return jwt.sign(
    { sub: trainer._id.toString(), email: trainer.email, role: "trainer" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function signRefreshToken(trainer) {
  return jwt.sign(
    { sub: trainer._id.toString(), role: "trainer" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ------------------ TRAINER LOGIN ------------------
exports.loginTrainer = async (req, res) => {
  try {
    console.log("Received trainer login", req.body);

    const { email, password, sector } = req.body;

    if (!email || !password || !sector) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1. Find Trainer
    const trainer = await Trainer.findOne({ email });
    
    if (!trainer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check if sector matches
    if (trainer.sector !== sector) {
      return res.status(401).json({ message: "Sector mismatch" });
    }

    // 3. Ensure password hash exists
    if (!trainer.passwordHash) {
      return res.status(500).json({ message: "Trainer has no passwordHash stored" });
    }

    // 4. Compare password once (FIXED)
    const ok = await bcrypt.compare(password, trainer.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 5. Generate tokens
    const accessToken = signAccessToken(trainer);
    const refreshToken = signRefreshToken(trainer);

    trainer.accessToken = accessToken;
    trainer.refreshToken = refreshToken;
    trainer.lastLoginAt = new Date();

    await trainer.save();

    return res.json({
      message: "Trainer logged in",
      accessToken,
      refreshToken,
      trainer: {
        id: trainer._id,
        email: trainer.email,
        displayName: trainer.displayName,
        sector: trainer.sector
      }
    });

  } catch (err) {
    console.error("Trainer Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ------------------ TRAINER REFRESH TOKEN ------------------
exports.refreshTrainer = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ message: "Missing refresh token" });

    const trainer = await Trainer.findOne({ refreshToken });
    if (!trainer)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccess = signAccessToken(trainer);
    const newRefresh = signRefreshToken(trainer);

    trainer.accessToken = newAccess;
    trainer.refreshToken = newRefresh;

    await trainer.save();

    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
    });

  } catch (err) {
    console.error("Trainer Refresh Error:", err);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};

// ------------------ LOGOUT ------------------
exports.logoutTrainer = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await Trainer.updateOne({ refreshToken }, { refreshToken: null });
    }

    return res.json({ message: "Trainer logged out" });

  } catch (err) {
    console.error("Trainer Logout Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.getTrainerProfile = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.trainerId).lean();

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    res.json({
      trainer: {
        id: trainer._id,
        email: trainer.email,
        displayName: trainer.displayName,
        sector: trainer.sector,
      },
    });
  } catch (err) {
    console.error("Get trainer profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

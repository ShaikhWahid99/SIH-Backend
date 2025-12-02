const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------ JWT Helpers ------------------

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ------------------ REGISTER ------------------

exports.register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      passwordHash,
      displayName,
      refreshToken: null,
    });

    await user.save();
    return res.json({ message: "Registered" });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------ LOGIN ------------------

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // 🔥 IMPORTANT FIX
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();

    await user.save();

    return res.json({
      message: "Logged in",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        onboarded: user.onboarded,
        quizCompleted: user.quizCompleted
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ------------------ GOOGLE OAUTH CALLBACK ------------------

exports.googleCallback = async (req, res) => {
  try {
    const profile = req.user;

    const googleId = profile.id;
    const email = profile.emails?.[0]?.value || null;

    let user = await User.findOne({
      "providers.name": "google",
      "providers.id": googleId,
    });

    // Check if user exists by email
    if (!user && email) {
      user = await User.findOne({ email });

      if (user) {
        const exists = user.providers.some(
          (p) => p.name === "google" && p.id === googleId
        );
        if (!exists) {
          user.providers.push({ name: "google", id: googleId });
        }
      }
    }

    // Create new user
    if (!user) {
      user = new User({
        email,
        emailVerified: true,
        displayName: profile.displayName || (email ? email.split("@")[0] : "User"),
        providers: [{ name: "google", id: googleId }],
        refreshToken: null,
      });
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // Redirect to frontend with tokens
    return res.redirect(
      `${process.env.APP_URL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );

  } catch (err) {
    console.error("Google callback error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------ REFRESH TOKEN ------------------

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ message: "Missing refresh token" });

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);

    user.accessToken = newAccess;
    user.refreshToken = newRefresh;
    await user.save();

    return res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
    });

  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};

// ------------------ LOGOUT ------------------

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.updateOne({ refreshToken }, { refreshToken: null });
    }

    return res.json({ message: "Logged out" });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

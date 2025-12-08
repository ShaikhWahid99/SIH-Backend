const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Trainer = require("../models/trainer");
const User = require("../models/User");
const UserDetails = require("../models/UserDetails");
const { getSession } = require("../config/neo4j");

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
      return res
        .status(500)
        .json({ message: "Trainer has no passwordHash stored" });
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
        sector: trainer.sector,
      },
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

exports.getLearnersBySector = async (req, res) => {
  let session;
  try {
    const trainer = await Trainer.findById(req.trainerId).lean();

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    const sector = String(trainer.sector || "");
    if (!sector) {
      return res.status(400).json({ message: "Trainer sector missing" });
    }

    const mongoUsers = await User.find({}, "_id email displayName")
      .limit(5000)
      .lean();
    const ids = mongoUsers.map((u) => String(u._id));

    let learners = [];
    try {
      session = getSession();
      const query = `
        MATCH (q:Qualification {sector: $sector})
        MATCH (u:User)-[r:RECOMMENDED_FOR]->(q)
        RETURN DISTINCT u
      `;

      const result = await session.run(query, { sector, ids });

      const mongoMap = new Map(mongoUsers.map((u) => [String(u._id), u]));

      learners = result.records.map((rec) => {
        const node = rec.get("u");
        const props = node.properties || {};
        const idCandidate =
          props.mongoId || props.mongo_id || props.userId || props.id;
        const id = String(idCandidate || node.elementId || node.identity);
        const mu = mongoMap.get(id);
        return {
          id,
          email: (mu && mu.email) || props.email || null,
          displayName:
            (mu && mu.displayName) || props.displayName || props.name || null,
          sector: props.sector || sector,
        };
      });
    } catch {}

    try {
      const learnerIds = learners.map((l) => l.id).filter(Boolean);
      if (learnerIds.length) {
        const detailDocs = await UserDetails.find(
          { user: { $in: learnerIds } },
          "user state district education.highestQualification skills interestSectors"
        ).lean();
        const map = new Map(detailDocs.map((d) => [String(d.user), d]));
        learners = learners.map((l) => {
          const d = map.get(String(l.id));
          return {
            ...l,
            details: d
              ? {
                  state: d.state || null,
                  district: d.district || null,
                  highestQualification: d.education?.highestQualification || null,
                  skills: Array.isArray(d.skills) ? d.skills : [],
                  interestSectors: Array.isArray(d.interestSectors) ? d.interestSectors : [],
                }
              : null,
          };
        });
      }
    } catch {}

    learners = learners.filter((l) => {
      const hasName = !!(l.displayName && String(l.displayName).trim());
      const d = l.details;
      const hasDetails = !!(
        d && (
          d.state ||
          d.district ||
          d.highestQualification ||
          (Array.isArray(d.skills) && d.skills.length > 0) ||
          (Array.isArray(d.interestSectors) && d.interestSectors.length > 0)
        )
      );
      return hasName || hasDetails;
    });

    return res.json({ sector, learners });
  } catch (err) {
    console.error("getLearnersBySector error:", err);
    return res.status(500).json({ message: "Failed to fetch learners" });
  } finally {
    if (session) await session.close();
  }
};

const jwt = require("jsonwebtoken");

exports.verifyTrainerToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ message: "Missing auth token" });

  const token = header.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "trainer") {
      return res.status(403).json({ message: "Not a trainer token" });
    }

    req.trainerId = decoded.sub;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

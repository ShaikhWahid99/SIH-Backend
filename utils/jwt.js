const jwt = require("jsonwebtoken");
const config = require("../config/env");

function signAccessToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    roles: user.roles || [],
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExp, // 15m
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signAccessToken, verifyAccessToken };

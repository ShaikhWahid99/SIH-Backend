const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashToken(token) {
  return bcrypt.hash(token, SALT_ROUNDS);
}

async function compareHash(token, hash) {
  return bcrypt.compare(token, hash);
}

module.exports = { hashToken, compareHash };

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');
const recommendations = require('../controllers/recommendations.controller');

// ✅ EXISTING PROFILE ROUTES
router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

module.exports = router;

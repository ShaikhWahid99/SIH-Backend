const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');

// ✅ EXISTING PROFILE ROUTES
router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

// ✅ ✅ ADD GOOGLE TRANSLATE ROUTE
const translateRoute = require('./translate.route');
router.use('/translate', translateRoute);

module.exports = router;

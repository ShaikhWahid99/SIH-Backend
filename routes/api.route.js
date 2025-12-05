const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');
const recommendations = require('../controllers/recommendations.controller');

// ✅ EXISTING PROFILE ROUTES
router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

router.get('/recommendations', requireAuth, recommendations.getRecommendations);

// NEW ROUTE ADDED HERE:
router.get('/pathways/:id', requireAuth, recommendations.getPathwayById);

router.get('/pathways/:id/graph', requireAuth, recommendations.getPathwayGraph);

module.exports = router;
// ✅ ✅ ADD GOOGLE TRANSLATE ROUTE
const translateRoute = require('./translate.route');
router.use('/translate', translateRoute);

module.exports = router;

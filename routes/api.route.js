const express =  require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');
const recommendations = require('../controllers/recommendations.controller');
const { getCourseById } = require('../controllers/recommendations.controller');
const recommendationsController = require('../controllers/recommendations.controller');

router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

router.get('/recommendations', requireAuth, recommendations.getRecommendations);

// NEW ROUTE ADDED HERE:
router.get('/pathways/:id', requireAuth, recommendations.getPathwayById);

router.get('/pathways/:id/graph', requireAuth, recommendations.getPathwayGraph);

router.get('/courses/:id', getCourseById);

router.get('/videos/search', recommendationsController.getRelatedVideos);

module.exports = router;
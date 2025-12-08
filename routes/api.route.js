const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');
const recommendations = require('../controllers/recommendations.controller');
// Removed duplicate imports for cleanliness

// ✅ EXISTING PROFILE ROUTES
router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

router.get('/recommendations', requireAuth, recommendations.getRecommendations);

// ✅ NEW: Skill India Recommendations
router.get('/recommendations/skill-india/:id', requireAuth, recommendations.getSkillIndiaSimilarCourses);

// PATHWAY ROUTES
router.get('/pathways/:id', requireAuth, recommendations.getPathwayById);
router.get('/pathways/:id/graph', requireAuth, recommendations.getPathwayGraph);

// COURSE & VIDEO ROUTES
router.get('/courses/:id', recommendations.getCourseById);
router.get('/videos/search', recommendations.getRelatedVideos);

// ✅ GOOGLE TRANSLATE ROUTE
const translateRoute = require('./translate.route');
router.use('/translate', translateRoute);

router.get('/skill-india/all', requireAuth, recommendations.getAllSkillIndiaCourses);

module.exports = router;
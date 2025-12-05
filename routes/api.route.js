const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');

// Merged imports: Use a single alias for the recommendations controller functions
// to avoid conflicts and keep the code clean.
const recommendations = require('../controllers/recommendations.controller');

// ✅ EXISTING PROFILE ROUTES
router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

router.get('/recommendations', requireAuth, recommendations.getRecommendations);

// ✅ NEW: Skill India Recommendations (From HEAD)
router.get('/recommendations/skill-india/:id', requireAuth, recommendations.getSkillIndiaSimilarCourses);

// PATHWAY ROUTES
router.get('/pathways/:id', requireAuth, recommendations.getPathwayById);
router.get('/pathways/:id/graph', requireAuth, recommendations.getPathwayGraph);

// COURSE & VIDEO ROUTES (Using the single 'recommendations' alias)
router.get('/courses/:id', recommendations.getCourseById);
router.get('/videos/search', recommendations.getRelatedVideos);

// ✅ ALL SKILL INDIA COURSES ROUTE (From HEAD)
router.get('/skill-india/all', requireAuth, recommendations.getAllSkillIndiaCourses);

// --- NEW FEATURES (From HEAD) ---

// ✅ GOOGLE TRANSLATE ROUTE
const translateRoute = require('./translate.route');
router.use('/translate', translateRoute);

// ✅ CHATBOT ROUTE
const chatRoute = require('./chat.route');
router.use('/chat', chatRoute);

module.exports = router;
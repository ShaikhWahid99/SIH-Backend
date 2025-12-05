const express =  require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const user = require('../controllers/user.controller');
const recommendations = require('../controllers/recommendations.controller');

router.get('/me', requireAuth, user.getProfile);
router.post('/me', requireAuth, user.upsertProfile);

router.get('/recommendations', requireAuth, recommendations.getRecommendations);

module.exports = router;

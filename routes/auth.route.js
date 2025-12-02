const express = require('express');
const passport = require('passport');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');

// ----------------- Local Auth -----------------

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);

// Refresh token (no cookies, DB-based)
router.post('/refresh', authLimiter, auth.refresh);

// Logout (clears accessToken + refreshToken in DB)
router.post('/logout', auth.logout);

// ----------------- Google OAuth -----------------

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback → no session, no cookies
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/google/failure'
  }),
  auth.googleCallback
);

// Failure route
router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google auth failure' });
});

module.exports = router;

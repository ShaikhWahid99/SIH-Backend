const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');

const authRouters = require('./routes/auth.route');
const apiRoutes = require('./routes/api.route');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: config.appUrl || 'http://localhost:8080',
      credentials: true,
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const p = {
            id: profile.id,
            provider: 'google',
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value || null,
          };

          return done(null, p);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  app.use(passport.initialize());

  // Routes
  app.use('/auth', authRouters);
  app.use('/api', apiRoutes);

  app.get('/', (req, res) => res.json({ ok: true }));

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };

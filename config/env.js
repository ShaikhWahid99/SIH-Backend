const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/learnpath',

  jwtSecret: process.env.JWT_SECRET,
  
  jwtAccessExp: process.env.JWT_ACCESS_EXP || '15m',
  refreshExpDays: Number(process.env.REFRESH_TOKEN_EXP_DAYS || 30),

  cookieSecure: process.env.COOKIE_SECURE === 'true',

  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },

  // ✅ ✅ ADD THIS INSIDE module.exports
  googleTranslate: {
    apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
  },

  appUrl: process.env.APP_URL || 'http://localhost:8081',

  isProd: process.env.NODE_ENV === 'production',

  neo4j: {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD || process.env.AUTH,
    database: process.env.NEO4J_DATABASE || 'neo4j',
  },
};

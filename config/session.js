const session = require('express-session');
const MongoStore = require('connect-mongo');

const isProduction = process.env.NODE_ENV === 'production';

const createSessionConfig = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab_tracking_system',
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    }),
    proxy: isProduction,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax'
    }
  });
};

module.exports = createSessionConfig;
